import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { z } from "zod";

// ─────────────────────────────────────────────────────
// POST /api/posts   — Create a new archived moment
// GET  /api/posts   — Fetch paginated feed
// ─────────────────────────────────────────────────────

const VALID_PILLARS = [
    "identity",
    "knowledge",
    "culture",
    "environment",
    "innovation",
    "community",
] as const;

const createPostSchema = z.object({
    title: z.string().min(3).max(100),
    caption: z.string().max(500).optional().default(""),
    pillar: z.enum(VALID_PILLARS),
    locationName: z.string().max(200).optional().default(""),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    imageCid: z.string().min(1),
    proofCid: z.string().min(1),
    imageUrl: z.string().url(),
    proofUrl: z.string().url(),
    imageCids: z.array(z.string().min(1)).optional().default([]),
    proofCids: z.array(z.string().min(1)).optional().default([]),
    imageUrls: z.array(z.string().url()).optional().default([]),
    proofUrls: z.array(z.string().url()).optional().default([]),
    livenessScore: z.number().optional().default(0),
    capturedAt: z.string().datetime(),
});

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    } catch {
        return null;
    }
}

// ── Helper: extract user ID from sb-access-token ─────
function getUserIdFromCookie(req: NextRequest): string | null {
    const token = req.cookies.get("sb-access-token")?.value;
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    return typeof payload?.sub === "string" ? payload.sub : null;
}

function normalizeSearchTerm(raw: string | null): string {
    if (!raw) return "";
    return raw.trim().replace(/[(),]/g, " ").replace(/\s+/g, " ").slice(0, 120);
}

function buildIlikePattern(term: string): string {
    // postgrest uses * as wildcard for like/ilike filters
    const sanitized = term.replace(/[*]/g, "");
    return `*${sanitized}*`;
}

// ── POST: Create a new post ──────────────────────────
export async function POST(req: NextRequest) {
    try {
        const userId = getUserIdFromCookie(req);
        if (!userId) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const body = await req.json().catch(() => null);
        const parsed = createPostSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid input",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const d = parsed.data;
        const supabase = createAdminClient();
        const imageCids = d.imageCids.length ? d.imageCids : [d.imageCid];
        const proofCids = d.proofCids.length ? d.proofCids : [d.proofCid];
        const imageUrls = d.imageUrls.length ? d.imageUrls : [d.imageUrl];
        const proofUrls = d.proofUrls.length ? d.proofUrls : [d.proofUrl];

        const { data: post, error: insertError } = await supabase
            .from("posts")
            .insert({
                user_id: userId,
                title: d.title,
                caption: d.caption,
                pillar: d.pillar,
                location_name: d.locationName,
                latitude: d.latitude,
                longitude: d.longitude,
                image_cid: imageCids[0],
                proof_cid: proofCids[0],
                image_url: imageUrls[0],
                proof_url: proofUrls[0],
                image_cids: imageCids,
                proof_cids: proofCids,
                image_urls: imageUrls,
                proof_urls: proofUrls,
                liveness_score: d.livenessScore,
                captured_at: d.capturedAt,
            })
            .select("*")
            .single();

        if (insertError || !post) {
            console.error("Post insert failed:", insertError);
            return NextResponse.json(
                { error: "Failed to create post" },
                { status: 500 },
            );
        }

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error("POST /api/posts error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// ── GET: Fetch paginated feed ────────────────────────
export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromCookie(req);
        if (!userId) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit = Math.min(
            50,
            Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
        );
        const pillar = searchParams.get("pillar");
        const filterUserId = searchParams.get("user_id");
        const queryText = normalizeSearchTerm(searchParams.get("q"));
        const offset = (page - 1) * limit;

        const supabase = createAdminClient();

        // Build the query — join with users for author info
        let query = supabase
            .from("posts")
            .select(
                `
                *,
                users!posts_user_id_fkey (
                    handle,
                    avatar_url,
                    humanity_score,
                    is_verified_human
                )
            `,
                { count: "exact" },
            )
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        // Optional user filter
        if (filterUserId) {
            query = query.eq("user_id", filterUserId);
        }

        // Optional pillar filter
        if (
            pillar &&
            VALID_PILLARS.includes(pillar as (typeof VALID_PILLARS)[number])
        ) {
            query = query.eq("pillar", pillar);
        }

        if (queryText) {
            const pattern = buildIlikePattern(queryText);
            const handleTerm = queryText.replace(/^@+/, "").trim();
            const handlePattern = buildIlikePattern(handleTerm);

            let matchingUserIds: string[] = [];
            if (handleTerm) {
                const { data: users, error: usersError } = await supabase
                    .from("users")
                    .select("id")
                    .ilike("handle", handlePattern)
                    .limit(100);

                if (usersError) {
                    console.error("User handle search failed:", usersError);
                } else {
                    matchingUserIds = (users ?? []).map((u) => u.id);
                }
            }

            const orFilters = [
                `title.ilike.${pattern}`,
                `caption.ilike.${pattern}`,
                `location_name.ilike.${pattern}`,
                `image_cid.ilike.${pattern}`,
                `proof_cid.ilike.${pattern}`,
                `image_url.ilike.${pattern}`,
                `proof_url.ilike.${pattern}`,
                `tx_hash.ilike.${pattern}`,
            ];

            if (matchingUserIds.length > 0) {
                orFilters.push(`user_id.in.(${matchingUserIds.join(",")})`);
            }

            query = query.or(orFilters.join(","));
        }

        const { data: posts, error: fetchError, count } = await query;

        if (fetchError) {
            console.error("Feed fetch failed:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch feed" },
                { status: 500 },
            );
        }

        const total = count ?? 0;
        const hasMore = offset + limit < total;

        const postIds = (posts ?? []).map((post) => post.id);
        let vouchedPostIds = new Set<string>();

        if (postIds.length > 0) {
            const { data: vouches, error: vouchFetchError } = await supabase
                .from("vouches")
                .select("post_id")
                .eq("voucher_id", userId)
                .in("post_id", postIds);

            if (vouchFetchError) {
                console.error("Failed to fetch user vouches:", vouchFetchError);
            } else {
                vouchedPostIds = new Set((vouches ?? []).map((v) => v.post_id));
            }
        }

        const postsWithVouchState = (posts ?? []).map((post) => ({
            ...post,
            has_vouched: vouchedPostIds.has(post.id),
        }));

        return NextResponse.json({
            posts: postsWithVouchState,
            hasMore,
            total,
            page,
        });
    } catch (error) {
        console.error("GET /api/posts error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
