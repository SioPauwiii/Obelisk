import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================
// PROXY (Next.js 16 middleware)
// ============================================================
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    return response;
}
