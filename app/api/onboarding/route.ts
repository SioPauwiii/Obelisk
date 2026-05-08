import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createAdminClient } from "@/lib/supabase";
import { z } from "zod";

// ─────────────────────────────────────────────────────
// POST /api/onboarding
//
// Saves onboarding profile data for the authenticated user.
// Re-mints the sb-access-token cookie with onboarded=true
// so the Edge middleware grants access to protected routes.
// ─────────────────────────────────────────────────────

const HANDLE_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

const onboardingSchema = z.object({
    handle: z
        .string()
        .min(3)
        .max(20)
        .regex(
            HANDLE_REGEX,
            "Handle must start with a letter, lowercase alphanumeric and underscores only",
        ),
    country: z.string().min(1).max(100),
    pillarPreference: z.array(z.string()).min(1),
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

export async function POST(req: NextRequest) {
    try {
        // ── 1. Get user identity from cookie ─────────
        const accessToken = req.cookies.get("sb-access-token")?.value;
        if (!accessToken) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const payload = decodeJwtPayload(accessToken);
        const userId = typeof payload?.sub === "string" ? payload.sub : null;

        if (!payload || !userId) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 },
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
                { status: 400 },
            );
        }

        const { handle, country, pillarPreference } = parsed.data;
        const pillarPreferenceStr = pillarPreference.join(",");

        // ── 3. Check handle uniqueness ───────────────
        const supabase = createAdminClient();

        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("handle", handle)
            .neq("id", userId)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "This handle is already taken" },
                { status: 409 },
            );
        }

        // ── 4. Update user record ────────────────────
        const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({
                handle,
                country,
                pillar_preference: pillarPreferenceStr,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
            .select(
                "id, privy_did, handle, email, full_name, avatar_url, wallet_address, auth_provider, is_verified_human, humanity_score, country, pillar_preference, voucher_count, created_at, updated_at",
            )
            .single();

        if (updateError || !updatedUser) {
            console.error("Onboarding update failed:", updateError);
            return NextResponse.json(
                { error: "Failed to save profile" },
                { status: 500 },
            );
        }

        // ── 4. Re-mint JWT with onboarded=true ───────
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            // Onboarding saved but cookie not refreshed — user will
            // get the updated cookie on next login. Not fatal.
            return NextResponse.json({ success: true, user: updatedUser });
        }

        const secret = new TextEncoder().encode(jwtSecret);
        const newJwt = await new SignJWT({
            sub: updatedUser.id,
            role: "authenticated",
            wallet_address: payload.wallet_address ?? null,
            onboarded: true,
            aud: "authenticated",
            iss: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
        })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(secret);

        const response = NextResponse.json({
            success: true,
            user: updatedUser,
        });

        response.cookies.set("sb-access-token", newJwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
        });

        return response;
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
