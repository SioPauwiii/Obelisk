"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

export default function LoginPage() {
    const router = useRouter();
    const { ready, authenticated, login } = usePrivyAuth();

    // Redirect once authenticated
    useEffect(() => {
        if (ready && authenticated) {
            router.replace("/dashboard");
        }
    }, [ready, authenticated, router]);

    // Show loading state while Privy is initializing
    if (!ready) {
        return (
            <div className="grid min-h-svh place-items-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                    <p className="text-sm text-slate-500">Initializing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid min-h-svh lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans">
            {/* ─── FORM SECTION ─────────────────────── */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <div className="flex items-center gap-2 font-medium">
                        {/* Make sure you have this image in your public folder, or change the src */}
                        <Image
                            src="/obelisk_logo.png"
                            alt="Logo"
                            className="h-10 w-10 object-contain"
                            width={40}
                            height={40}
                        />
                        <span className="text-indigo-950 dark:text-indigo-100 font-bold tracking-wide">
                            Obelisk
                        </span>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <div className="flex flex-col gap-6">
                            {/* ─── Header ─────────────── */}
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    Sign in with Privy
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Use your wallet to authenticate securely and
                                    access your dashboard.
                                </p>
                            </div>

                            {/* ─── Login Button ──────── */}
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={login}
                                    disabled={!ready}
                                    className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
                                >
                                    Connect Wallet
                                </button>
                            </div>

                            {/* ─── Footer ──────────────── */}
                            <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed mt-4">
                                By connecting, you agree to our Terms of Service
                                and Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── VISUAL SECTION ───────────────────── */}
            <div className="relative hidden lg:flex items-center justify-center bg-[#0d1128] overflow-hidden">
                {/* Ambient background glows matching the logo */}
                <div className="absolute top-1/4 left-1/4 w-100 h-100 bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-112.5 h-112.5 bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-50 h-50 bg-yellow-300/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="absolute inset-0 bg-linear-to-t from-[#0d1128] via-transparent to-transparent z-10 pointer-events-none" />

                <div className="absolute bottom-10 left-10 right-10 z-20">
                    <blockquote className="space-y-2 text-cyan-50">
                        <p className="text-lg font-medium leading-relaxed">
                            &ldquo;Securely access Obelisk — a
                            blockchain-powered humanity archive preserving
                            identity, authenticity, and digital legacy for
                            future generations.&rdquo;
                        </p>
                        <footer className="text-sm font-semibold text-cyan-400/80 tracking-wide"></footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
