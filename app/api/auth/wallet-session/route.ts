import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/node";
import { SignJWT } from "jose";
import { createAdminClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────
// Privy client (server-side)
// ─────────────────────────────────────────────────────

const privy = new PrivyClient({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    appSecret: process.env.PRIVY_APP_SECRET!,
});

// Explicit column list — never use select("*")
const USER_COLS =
    "id, privy_did, handle, email, full_name, avatar_url, wallet_address, auth_provider, is_verified_human, humanity_score, country, pillar_preference, voucher_count, created_at, updated_at";

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

function extractBearer(req: NextRequest): string | null {
    const h = req.headers.get("authorization");
    if (!h?.startsWith("Bearer ")) return null;
    return h.slice(7);
}

async function verifyToken(token: string) {
    return privy.utils().auth().verifyAccessToken(token);
}

function resolveWalletAddress(privyUser: {
    wallet?: { address?: string | null };
    linked_accounts?: Array<{
        type?: string;
        address?: string | null;
        wallet_client_type?: string;
    }>;
}) {
    if (typeof privyUser.wallet?.address === "string") {
        return privyUser.wallet.address.toLowerCase();
    }

    const walletAccount = privyUser.linked_accounts?.find(
        (account) =>
            account.type === "wallet" && typeof account.address === "string",
    );

    return walletAccount?.address?.toLowerCase() ?? null;
}

// ─────────────────────────────────────────────────────
// POST /api/auth/wallet-session
//
// Flow:
//  1. Verify Privy access token → get DID
//  2. Fetch Privy user → get email, wallet, auth provider
//  3. Lookup user by privy_did (industry-standard)
//  4. Mint custom Supabase JWT
//  5. Set httpOnly cookie
// ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        // ── 1. Verify token ──────────────────────────
        const token = extractBearer(req);
        if (!token) {
            return NextResponse.json(
                { error: "Missing authorization header" },
                { status: 401 },
            );
        }

        let verifiedClaims;
        try {
            verifiedClaims = await verifyToken(token);
        } catch {
            return NextResponse.json(
                { error: "Invalid or expired Privy token" },
                { status: 401 },
            );
        }

        const privyDid = verifiedClaims.user_id;

        // ── 2. Fetch Privy user ──────────────────────
        let walletAddress: string | null = null;
        let email: string | null = null;
        let authProvider = "unknown";

        try {
            const privyUser = await privy.users()._get(privyDid);

            walletAddress = resolveWalletAddress(privyUser);

            for (const account of privyUser.linked_accounts) {
                if (
                    !walletAddress &&
                    account.type === "wallet" &&
                    account.address
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

        // ── 3. Upsert by privy_did ──────────────────
        const supabase = createAdminClient();
        const now = new Date().toISOString();

        // Primary lookup: privy_did
        let { data: existingUser } = await supabase
            .from("users")
            .select(USER_COLS)
            .eq("privy_did", privyDid)
            .single();

        // Migration fallback: lookup by wallet_address for pre-migration users
        if (!existingUser && walletAddress) {
            const { data: walletUser } = await supabase
                .from("users")
                .select(USER_COLS)
                .eq("wallet_address", walletAddress)
                .single();

            if (walletUser) {
                // Backfill privy_did on the legacy row
                await supabase
                    .from("users")
                    .update({ privy_did: privyDid, updated_at: now })
                    .eq("id", walletUser.id);
                existingUser = { ...walletUser, privy_did: privyDid };
            }
        }

        let dbUser;

        if (existingUser) {
            // Update — preserve existing email and auth_provider
            const updateFields: Record<string, unknown> = {
                updated_at: now,
            };

            if (!existingUser.email && email) {
                updateFields.email = email;
            }
            if (
                existingUser.auth_provider === "unknown" &&
                authProvider !== "unknown"
            ) {
                updateFields.auth_provider = authProvider;
            }
            if (!existingUser.wallet_address && walletAddress) {
                updateFields.wallet_address = walletAddress;
            }

            const { data: updatedUser } = await supabase
                .from("users")
                .update(updateFields)
                .eq("id", existingUser.id)
                .select(USER_COLS)
                .single();

            dbUser = updatedUser || existingUser;
        } else {
            // Insert new user
            const { data: newUser, error: insertError } = await supabase
                .from("users")
                .insert({
                    privy_did: privyDid,
                    email,
                    wallet_address: walletAddress,
                    auth_provider: authProvider,
                    is_verified_human: false,
                    humanity_score: 0,
                    voucher_count: 0,
                    created_at: now,
                    updated_at: now,
                })
                .select(USER_COLS)
                .single();

            if (insertError || !newUser) {
                console.error("Failed to insert user:", insertError);
                return NextResponse.json(
                    { error: "Failed to create user record" },
                    { status: 500 },
                );
            }

            dbUser = newUser;
        }

        // ── 4. Mint Supabase JWT ─────────────────────
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 },
            );
        }

        const secret = new TextEncoder().encode(jwtSecret);
        const supabaseJwt = await new SignJWT({
            sub: dbUser.id,
            role: "authenticated",
            wallet_address: walletAddress,
            onboarded: !!dbUser.handle,
            aud: "authenticated",
            iss: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
        })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(secret);

        // ── 5. Set cookie & respond ──────────────────
        const response = NextResponse.json({
            user: dbUser,
            walletAddress,
        });

        response.cookies.set("sb-access-token", supabaseJwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
        });

        return response;
    } catch (error) {
        console.error("Wallet session error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// ─────────────────────────────────────────────────────
// PATCH /api/auth/wallet-session
//
// Called after the client creates an embedded wallet.
// Updates wallet_address on the user record if it's null.
// ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    try {
        const token = extractBearer(req);
        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        let verifiedClaims;
        try {
            verifiedClaims = await verifyToken(token);
        } catch {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 },
            );
        }

        const body = await req.json().catch(() => ({}));
        const newWallet = body.walletAddress;
        if (!newWallet || typeof newWallet !== "string") {
            return NextResponse.json(
                { error: "Missing walletAddress" },
                { status: 400 },
            );
        }

        const supabase = createAdminClient();

        // Only update if wallet_address is currently null
        const { data } = await supabase
            .from("users")
            .update({
                wallet_address: newWallet.toLowerCase(),
                updated_at: new Date().toISOString(),
            })
            .eq("privy_did", verifiedClaims.user_id)
            .is("wallet_address", null)
            .select("wallet_address")
            .single();

        return NextResponse.json({
            updated: !!data,
            walletAddress: data?.wallet_address ?? null,
        });
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
