import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ─────────────────────────────────────────────────────
// Session Guard Proxy (Next.js 16)
//
// In Next.js 16, `middleware.ts` has been renamed to `proxy.ts`
// and the exported function must be named `proxy`.
//
// Protects all app routes except public paths.
// Checks for a valid Supabase JWT in the sb-access-token cookie.
// ─────────────────────────────────────────────────────

// Routes that don't require authentication
const PUBLIC_PATHS = ["/signin", "/signup", "/login"];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public pages (login, signup)
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // ── Check for valid session cookie ───────────────
    const token = request.cookies.get("sb-access-token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/signin", request.url));
    }

    // Verify JWT
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
        // If secret is not configured, allow through in dev
        console.warn("SUPABASE_JWT_SECRET not set — skipping session check");
        return NextResponse.next();
    }

    try {
        const secret = new TextEncoder().encode(jwtSecret);
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch {
        // Token is invalid or expired — redirect to login
        const response = NextResponse.redirect(
            new URL("/signin", request.url)
        );
        // Clear the invalid cookie
        response.cookies.set("sb-access-token", "", {
            httpOnly: true,
            path: "/",
            maxAge: 0,
        });
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - Public assets (images, manifest, etc.)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.webp$).*)",
    ],
};
