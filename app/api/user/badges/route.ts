import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import sbtLevels from "@/lib/data/sbt_levels.json";

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

export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromCookie(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const supabase = createAdminClient();

        // 1. Fetch user to get received_vouches
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("received_vouches, humanity_score")
            .eq("id", userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const totalVouches = user.received_vouches || 0;

        // 2. Determine unlocked milestones from sbt_levels.json
        const milestones = sbtLevels.map((level: any) => {
            const requiredVouches = level.attributes.find(
                (attr: any) => attr.trait_type === "Likes Milestone"
            )?.value || 0;
            
            return {
                ...level,
                required_vouches: requiredVouches,
                is_unlocked: totalVouches >= requiredVouches
            };
        });

        // 3. Fetch user's individual post SBTs
        const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("id, title, pillar, tx_hash, sbt_token_id, image_url")
            .eq("user_id", userId)
            .eq("sbt_mint_status", "success")
            .order("created_at", { ascending: false });

        if (postsError) {
            console.error("Failed to fetch post SBTs:", postsError);
        }

        return NextResponse.json({
            stats: {
                total_vouches: totalVouches,
                humanity_score: user.humanity_score || 0
            },
            milestones,
            post_sbts: posts || []
        });

    } catch (error) {
        console.error("GET /api/user/badges error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
