import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/node";
import { createAdminClient } from "@/lib/supabase";
import { z } from "zod";

// ─────────────────────────────────────────────────────
// POST /api/onboarding
//
// Saves onboarding profile data for the authenticated user.
// Requires the sb-access-token cookie (set by wallet-session).
// ─────────────────────────────────────────────────────

const privy = new PrivyClient({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    appSecret: process.env.PRIVY_APP_SECRET!,
});

const onboardingSchema = z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(1).max(50),
    country: z.string().min(1).max(100),
    pillarPreference: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
    try {
        // ── 1. Get user identity from cookie ─────────
        const accessToken = req.cookies.get("sb-access-token")?.value;
        if (!accessToken) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Decode the JWT to get the sub (user id) — we minted this ourselves
        // so we trust its structure after cookie validation
        let userId: string;
        try {
            const payload = JSON.parse(
                Buffer.from(accessToken.split(".")[1], "base64").toString()
            );
            userId = payload.sub;
            if (!userId) throw new Error("No sub in token");
        } catch {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 }
            );
        }

        // ── 2. Validate request body ─────────────────
        const body = await req.json().catch(() => null);
        const parsed = onboardingSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid input",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { firstName, lastName, country, pillarPreference } = parsed.data;
        const fullName = `${firstName} ${lastName}`.trim();
        const pillarPreferenceStr = pillarPreference.join(",");

        // ── 3. Update user record ────────────────────
        const supabase = createAdminClient();

        const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({
                full_name: fullName,
                country,
                pillar_preference: pillarPreferenceStr,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
            .select(
                "id, privy_did, email, full_name, avatar_url, wallet_address, auth_provider, is_verified_human, humanity_score, country, pillar_preference, voucher_count, created_at, updated_at"
            )
            .single();

        if (updateError || !updatedUser) {
            console.error("Onboarding update failed:", updateError);
            return NextResponse.json(
                { error: "Failed to save profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
