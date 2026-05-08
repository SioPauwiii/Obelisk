import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────
// Edge Middleware — Route Guarding
//
// Runs at the Edge BEFORE any page renders.
// Uses the `sb-access-token` cookie (httpOnly JWT) set
// by /api/auth/wallet-session to determine auth state.
//
// JWT payload includes:
//   sub          — Supabase user id
//   onboarded    — boolean (full_name is set)
// ─────────────────────────────────────────────────────

// Routes that require authentication + completed onboarding
const PROTECTED_ROUTES = ["/dashboard", "/capture"];

// Routes that require authentication but NOT onboarding
const ONBOARDING_ROUTES = ["/onboarding"];

// Routes that authenticated users should be redirected away from
const AUTH_ROUTES = ["/signin"];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch {
        return null;
    }
}

function isExpired(payload: Record<string, unknown>): boolean {
    const exp = payload.exp;
    if (typeof exp !== "number") return true;
    return Date.now() >= exp * 1000;
}

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const token = req.cookies.get("sb-access-token")?.value;
    const payload = token ? decodeJwtPayload(token) : null;
    const isAuthenticated = payload && !isExpired(payload);
    const isOnboarded = isAuthenticated && payload?.onboarded === true;

    // ── 1. Auth routes (signin): redirect away if logged in ──
    if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
        if (isAuthenticated) {
            const dest = isOnboarded ? "/dashboard" : "/onboarding";
            return NextResponse.redirect(new URL(dest, req.url));
        }
        return NextResponse.next();
    }

    // ── 2. Onboarding route: require auth, redirect if already done ──
    if (ONBOARDING_ROUTES.some((r) => pathname.startsWith(r))) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/signin", req.url));
        }
        if (isOnboarded) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
    }

    // ── 3. Protected routes: require auth + onboarding ──
    if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/signin", req.url));
        }
        if (!isOnboarded) {
            return NextResponse.redirect(new URL("/onboarding", req.url));
        }
        return NextResponse.next();
    }

    // ── 4. Root / — redirect based on state ──
    if (pathname === "/") {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/signin", req.url));
        }
        if (!isOnboarded) {
            return NextResponse.redirect(new URL("/onboarding", req.url));
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Only run middleware on specific app routes.
         * Explicitly EXCLUDE:
         *   - /api/*          (API routes handle their own auth)
         *   - /_next/*        (Next.js internals, static/image)
         *   - /favicon.ico    (browser favicon)
         *   - Static files    (anything with a file extension like .png, .js, .css)
         */
        "/",
        "/signin",
        "/signin/:path*",
        "/onboarding",
        "/onboarding/:path*",
        "/dashboard",
        "/dashboard/:path*",
        "/capture",
        "/capture/:path*",
    ],
};
