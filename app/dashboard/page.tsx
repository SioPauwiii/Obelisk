"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAuthedFetch } from "@/lib/api/authFetch";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

interface MeResponse {
    did: string;
    walletAddress: string | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { ready, authenticated, walletAddress, logout, getToken } = usePrivyAuth();

    const apiFetch = useMemo(() => buildAuthedFetch(getToken), [getToken]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["me"],
        queryFn: () => apiFetch<MeResponse>("/api/v1/auth/me"),
        enabled: ready && authenticated,
    });

    if (!ready) {
        return <div className="min-h-svh bg-slate-950" />;
    }

    if (!authenticated) {
        router.replace("/signin");
        return null;
    }

    const onLogout = async () => {
        await logout();
        queryClient.clear();
        router.replace("/signin");
    };

    return (
        <div className="min-h-svh bg-slate-950 text-slate-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-lg bg-slate-900/80 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-2xl">Dashboard</CardTitle>
                    <CardDescription className="text-slate-400">
                        Protected route using Privy access token verification.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? <p className="text-sm text-slate-400">Loading profile...</p> : null}
                    {isError ? <p className="text-sm text-red-400">Unable to load profile.</p> : null}
                    <div className="rounded-md border border-slate-800 bg-slate-950 p-4 space-y-2">
                        <p className="text-sm text-slate-400">Frontend wallet</p>
                        <p className="font-mono text-sm break-all">{walletAddress ?? "No wallet linked"}</p>
                    </div>
                    <div className="rounded-md border border-slate-800 bg-slate-950 p-4 space-y-2">
                        <p className="text-sm text-slate-400">Verified wallet (backend)</p>
                        <p className="font-mono text-sm break-all">{data?.walletAddress ?? "Not available"}</p>
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={onLogout}>
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
