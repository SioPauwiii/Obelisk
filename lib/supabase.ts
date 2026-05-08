import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────
// Browser Client (client-side, uses anon key)
// ─────────────────────────────────────────────────────
let browserClient: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
    if (browserClient) return browserClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
        );
    }

    browserClient = createClient(url, anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    return browserClient;
}

// ─────────────────────────────────────────────────────
// Admin Client (server-side only, uses service role key)
// Bypasses RLS — NEVER expose to the client
// ─────────────────────────────────────────────────────
export function createAdminClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
        );
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
