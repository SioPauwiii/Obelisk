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
    livenessScore: z.number().optional().default(0),
    capturedAt: z.string().datetime(),
});

// ── Helper: extract user ID from sb-access-token ─────
function getUserIdFromCookie(req: NextRequest): string | null {
    const token = req.cookies.get("sb-access-token")?.value;
    if (!token) return null;
    try {
        const payload = JSON.parse(
            Buffer.from(token.split(".")[1], "base64").toString(),
        );
        return payload.sub ?? null;
    } catch {
        return null;
    }
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
                image_cid: d.imageCid,
                proof_cid: d.proofCid,
                image_url: d.imageUrl,
                proof_url: d.proofUrl,
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

        // Optional pillar filter
        if (pillar && VALID_PILLARS.includes(pillar as (typeof VALID_PILLARS)[number])) {
            query = query.eq("pillar", pillar);
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

        return NextResponse.json({
            posts: posts ?? [],
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
