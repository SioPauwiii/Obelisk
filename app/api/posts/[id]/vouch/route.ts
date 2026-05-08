import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { mintSBT } from "@/lib/blockchain/mintSBT";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/posts/[id]/vouch
//
// Authenticated user vouches for a post.
// If this is the FIRST vouch (vouch_count goes 0 → 1), triggers SBT minting.
// ─────────────────────────────────────────────────────────────────────────────

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

function getUserIdFromCookie(req: NextRequest): string | null {
    const token = req.cookies.get("sb-access-token")?.value;
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    return typeof payload?.sub === "string" ? payload.sub : null;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: postId } = await params;

        // ── 1. Auth ───────────────────────────────────────
        const voucherId = getUserIdFromCookie(req);
        if (!voucherId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const supabase = createAdminClient();

        // ── 2. Fetch the post ─────────────────────────────
        const { data: post, error: postError } = await supabase
            .from("posts")
            .select(`
                id, title, caption, pillar, image_url, proof_url,
                liveness_score, captured_at, vouch_count,
                sbt_mint_status, sbt_mint_attempts, user_id,
                users!posts_user_id_fkey ( wallet_address )
            `)
            .eq("id", postId)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // ── 3. Self-vouch guard ───────────────────────────
        if (post.user_id === voucherId) {
            return NextResponse.json(
                { error: "You cannot vouch for your own post" },
                { status: 403 },
            );
        }

        // ── 4. Insert vouch (unique constraint handles duplicates) ──
        const { error: vouchError } = await supabase
            .from("vouches")
            .insert({ post_id: postId, voucher_id: voucherId });

        if (vouchError) {
            // Unique constraint violation = already vouched
            if (vouchError.code === "23505") {
                return NextResponse.json(
                    { error: "You have already vouched for this post" },
                    { status: 409 },
                );
            }
            console.error("Vouch insert failed:", vouchError);
            return NextResponse.json({ error: "Failed to vouch" }, { status: 500 });
        }

        // ── 5. Increment vouch_count ──────────────────────
        const { data: updatedPost, error: updateError } = await supabase
            .from("posts")
            .update({ vouch_count: (post.vouch_count ?? 0) + 1 })
            .eq("id", postId)
            .select("vouch_count, sbt_mint_status")
            .single();

        if (updateError || !updatedPost) {
            console.error("vouch_count update failed:", updateError);
            return NextResponse.json({ error: "Vouch saved but count update failed" }, { status: 500 });
        }

        // ── 6. Increment voucher_count on the vouching user ──
        await supabase.rpc("increment_voucher_count", { user_id: voucherId });

        // ── 7. Trigger SBT mint on first vouch ───────────
        const newVouchCount = updatedPost.vouch_count ?? 1;
        const sbtTriggered  = newVouchCount === 1 && post.sbt_mint_status === "none";

        if (sbtTriggered) {
            const authorWalletAddress = (post.users as any)?.wallet_address as string | null;

            if (!authorWalletAddress) {
                console.warn(`[vouch] Post ${postId} author has no wallet — SBT skipped`);
            } else {
                // Mark as pending immediately so the UI can react
                await supabase
                    .from("posts")
                    .update({ sbt_mint_status: "pending" })
                    .eq("id", postId);

                // Fire-and-forget — don't await, respond to user now
                mintSBT(post as any, authorWalletAddress).catch((err) => {
                    console.error(`[vouch] Background mintSBT failed for post ${postId}:`, err);
                });
            }
        }

        return NextResponse.json({
            success: true,
            vouchCount: newVouchCount,
            sbtTriggered,
        });

    } catch (error) {
        console.error("POST /api/posts/[id]/vouch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
