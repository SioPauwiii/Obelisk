"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buildAuthedFetch } from "@/lib/api/authFetch";
import { useAuth } from "@/hooks/useAuth";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

interface MeResponse {
    did: string;
    walletAddress: string | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const {
        user,
        walletAddress,
        isAuthenticated,
        isLoading,
        logout,
    } = useAuth();
    const { ready, authenticated, getToken } = usePrivyAuth();

    const apiFetch = useMemo(() => buildAuthedFetch(getToken), [getToken]);

    const { data, isLoading: meLoading, isError } = useQuery({
        queryKey: ["me"],
        queryFn: () => apiFetch<MeResponse>("/api/v1/auth/me"),
        enabled: ready && authenticated,
    });

    if (isLoading) {
        return (
            <div className="grid min-h-svh place-items-center bg-slate-950 font-sans">
                <div className="flex flex-col items-center gap-4 z-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-900 border-t-indigo-500" />
                    <p className="text-sm text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.replace("/signin");
        return null;
    }

    const onLogout = async () => {
        await logout();
        queryClient.clear();
        router.replace("/signin");
    };

    return (
        <div className="relative flex min-h-svh items-center justify-center bg-[#0d1128] p-6 font-sans overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

            {/* Main Content Card */}
            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800/60 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl">
                <div className="mb-8 border-b border-slate-800 pb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Dashboard
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Your authenticated session with Supabase backend integration.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Status Messages */}
                    {meLoading && (
                        <div className="flex items-center gap-3 text-sm text-cyan-400">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-900 border-t-cyan-400" />
                            Loading profile...
                        </div>
                    )}

                    {isError && (
                        <p className="text-sm text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                            Unable to load profile from Express backend.
                        </p>
                    )}

                    {/* Supabase User Info */}
                    {user && (
                        <>
                            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 shadow-inner">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                    Email
                                </h3>
                                <p className="font-mono text-sm text-slate-200 break-all">
                                    {user.email ?? "Not provided"}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 shadow-inner">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                    Auth Provider
                                </h3>
                                <p className="font-mono text-sm text-slate-200 capitalize">
                                    {user.auth_provider}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 shadow-inner">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                    Humanity Score
                                </h3>
                                <p className="font-mono text-sm text-slate-200">
                                    {user.humanity_score}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Wallet Data */}
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 shadow-inner">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Embedded Wallet
                        </h3>
                        <p className="font-mono text-sm text-slate-200 break-all">
                            {walletAddress ?? "No wallet linked"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 shadow-inner">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Verified Wallet (Backend)
                        </h3>
                        <p className="font-mono text-sm text-slate-200 break-all">
                            {data?.walletAddress ?? "Not available"}
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full rounded-lg border border-slate-700 bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-[#0d1128]"
                    >
                        Secure Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
