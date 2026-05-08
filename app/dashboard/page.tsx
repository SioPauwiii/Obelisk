"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
    const router = useRouter();
    const { logout } = usePrivyAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            await logout();
            router.replace("/signin");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <main className="min-h-svh bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                <header className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Humanity Archive
                            </p>
                            <h1 className="text-3xl font-bold">Dashboard</h1>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            {isLoggingOut ? "Signing out..." : "Sign out"}
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Your verified moments, identity status, and on-chain legacy
                        will live here.
                    </p>
                </header>

                <section className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Humanity Score
                        </p>
                        <p className="mt-4 text-3xl font-semibold">0</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Complete your first verified post to start scoring.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Verification Status
                        </p>
                        <p className="mt-4 text-2xl font-semibold">Pending</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Invite 3 verified humans to complete verification.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Archived Moments
                        </p>
                        <p className="mt-4 text-3xl font-semibold">0</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Capture your first live moment to begin.
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent activity</h2>
                        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            View all
                        </button>
                    </div>
                    <div className="mt-4 grid gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-4 py-3 dark:border-slate-800">
                            <span>No verified posts yet.</span>
                            <span className="text-xs">Start now</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-4 py-3 dark:border-slate-800">
                            <span>Proof-of-personhood checklist is empty.</span>
                            <span className="text-xs">Invite friends</span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
