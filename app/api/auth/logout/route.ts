import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────
// POST /api/auth/logout
//
// Clears the Supabase session cookie.
// The client should also call privy.logout() separately.
// ─────────────────────────────────────────────────────

export async function POST() {
    const response = NextResponse.json({ success: true });

    response.cookies.set("sb-access-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0, // Expire immediately
    });

    return response;
}
