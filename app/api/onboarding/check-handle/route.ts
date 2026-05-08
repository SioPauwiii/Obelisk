import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────
// GET /api/onboarding/check-handle?handle=rin
//
// Returns whether a handle is available.
// ─────────────────────────────────────────────────────

const HANDLE_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

export async function GET(req: NextRequest) {
    const handle = req.nextUrl.searchParams.get("handle")?.toLowerCase();

    if (!handle || !HANDLE_REGEX.test(handle)) {
        return NextResponse.json(
            { available: false, reason: "Invalid handle format" },
            { status: 200 },
        );
    }

    const supabase = createAdminClient();
    const { data } = await supabase
        .from("users")
        .select("id")
        .eq("handle", handle)
        .single();

    return NextResponse.json({
        available: !data,
        handle,
    });
}
