import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/node";
import { SignJWT } from "jose";
import { createAdminClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────
// POST /api/auth/wallet-session
//
// Flow:
//  1. Verify Privy access token
//  2. Fetch user from Privy using the verified DID (no identity token needed)
//  3. Upsert into public.users
//  4. Mint custom Supabase JWT
//  5. Set httpOnly cookie
// ─────────────────────────────────────────────────────

const privy = new PrivyClient({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    appSecret: process.env.PRIVY_APP_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        // ── 1. Extract & verify Privy access token ───────
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing authorization header" },
                { status: 401 }
            );
        }

        const accessToken = authHeader.slice(7);

        let verifiedClaims;
        try {
            verifiedClaims =
                await privy.utils().auth().verifyAccessToken(accessToken);
        } catch {
            return NextResponse.json(
                { error: "Invalid or expired Privy token" },
                { status: 401 }
            );
        }

        // ── 2. Fetch user from Privy using verified DID ──
        // verifiedClaims.userId is the Privy DID — already trusted, no extra
        // client-side token needed. This avoids the rate-limited /users/me endpoint.
        const body = await req.json().catch(() => ({}));

        let walletAddress: string | null = null;
        let email: string | null = null;
        let authProvider = "unknown";

        try {
            // verifiedClaims.user_id is the Privy user ID from the access token
            const privyUser = await privy.users()._get(verifiedClaims.user_id);

            for (const account of privyUser.linked_accounts) {
                if (
                    account.type === "wallet" &&
                    "wallet_client_type" in account &&
                    account.wallet_client_type === "privy"
                ) {
                    walletAddress = account.address.toLowerCase();
                }

                if (account.type === "google_oauth") {
                    authProvider = "google";
                    email = account.email ?? email;
                } else if (account.type === "apple_oauth") {
                    authProvider = "apple";
                    if ("email" in account) {
                        email = (account.email as string) ?? email;
                    }
                } else if (account.type === "email") {
                    if (authProvider === "unknown") authProvider = "email";
                    email = account.address ?? email;
                }
            }
        } catch (err) {
            console.error("Failed to fetch Privy user:", err);
        }

        // Fallback: use wallet address from request body if server lookup failed
        if (!walletAddress && body.walletAddress) {
            walletAddress = body.walletAddress.toLowerCase();
        }

        if (!walletAddress) {
            return NextResponse.json(
                { error: "No wallet address found" },
                { status: 400 }
            );
        }

        // ── 3. Upsert into public.users ──────────────────
        const supabase = createAdminClient();
        const now = new Date().toISOString();

        // Check if user already exists by wallet_address
        const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("wallet_address", walletAddress)
            .single();

        let dbUser;

        if (existingUser) {
            // Update existing user
            const { data: updatedUser } = await supabase
                .from("users")
                .update({
                    email: email ?? undefined,
                    auth_provider: authProvider,
                    updated_at: now,
                })
                .eq("id", existingUser.id)
                .select("*")
                .single();

            dbUser = updatedUser || existingUser;
        } else {
            // Insert new user
            const { data: newUser, error: insertError } = await supabase
                .from("users")
                .insert({
                    email,
                    wallet_address: walletAddress,
                    auth_provider: authProvider,
                    is_verified_human: false,
                    humanity_score: 0,
                    voucher_count: 0,
                    created_at: now,
                    updated_at: now,
                })
                .select("*")
                .single();

            if (insertError || !newUser) {
                console.error("Failed to insert user:", insertError);
                return NextResponse.json(
                    { error: "Failed to create user record" },
                    { status: 500 }
                );
            }

            dbUser = newUser;
        }

        const userId = dbUser.id;

        // ── 4. Mint custom Supabase JWT ──────────────────
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const secret = new TextEncoder().encode(jwtSecret);
        const supabaseJwt = await new SignJWT({
            sub: userId,
            role: "authenticated",
            wallet_address: walletAddress,
            aud: "authenticated",
            iss: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
        })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(secret);

        // ── 5. Set httpOnly cookie & respond ─────────────
        const response = NextResponse.json({
            user: dbUser,
            walletAddress,
        });

        response.cookies.set("sb-access-token", supabaseJwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60, // 1 hour
        });

        return response;
    } catch (error) {
        console.error("Wallet session error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
