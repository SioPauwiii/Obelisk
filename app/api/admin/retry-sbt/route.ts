import { NextRequest, NextResponse } from "next/server";
import { retryFailedMints } from "@/lib/blockchain/mintSBT";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/retry-sbt
//
// Picks up all posts with sbt_mint_status = 'pending' | 'failed'
// and attempts to re-mint, up to MAX_ATTEMPTS (3) total per post.
//
// Protected by a shared secret header: x-admin-secret
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const adminSecret = req.headers.get("x-admin-secret");
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[retry-sbt] Starting retry sweep...");

    const result = await retryFailedMints();

    console.log(`[retry-sbt] Done. processed=${result.processed} succeeded=${result.succeeded} failed=${result.failed}`);

    return NextResponse.json({ success: true, ...result });
}
