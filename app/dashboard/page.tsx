"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { buildAuthedFetch } from "@/lib/api/authFetch";
import { useAuth } from "@/hooks/useAuth";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { MainContent } from "@/components/dashboard/MainContent";

interface MeResponse {
    did: string;
    walletAddress: string | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const {
        user,
        walletAddress,
        isAuthenticated,
        isLoading,
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

    return (
        <MainContent>
            <div>
                {/* Content area - empty for now */}
            </div>
        </MainContent>
    );
}
