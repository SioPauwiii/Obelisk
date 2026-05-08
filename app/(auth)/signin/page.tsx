"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLoginWithOAuth } from "@privy-io/react-auth";
import { useAuth } from "@/hooks/useAuth";
import { LoginWithEmail } from "@/components/auth/LoginWithEmail";
import { Wallet } from "lucide-react";
import { MatrixRain } from "@/components/UI/MatrixRain";
import GoogleIcon from "@/public/googleicon";

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading, authError, clearError } =
        useAuth();
    const { initOAuth } = useLoginWithOAuth();
    const [activeMethod, setActiveMethod] = useState<string | null>(null);

    // Redirect once fully authenticated (Privy + Supabase session ready)
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.replace("/dashboard");
        }
    }, [isAuthenticated, isLoading, router]);

    const handleWalletLogin = () => {
        clearError();
        setActiveMethod("wallet");
        login("wallet");
    };

    const handleGoogleLogin = () => {
        clearError();
        setActiveMethod("google");
        // Use initOAuth directly — this is the working approach
        // useAuth will pick up the session after Privy authenticates
        initOAuth({ provider: "google" });
    };

    const handleReset = () => {
        clearError();
        setActiveMethod(null);
    };

    // Show loading state while initializing
    if (isLoading && !activeMethod) {
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
                                    Sign in to Obelisk
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Choose your preferred sign-in method to
                                    access your account and explore the Obelisk
                                    archive.
                                </p>
                            </div>

                            {/* ─── Error Display ──────── */}
                            {authError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                    <p className="font-semibold">
                                        Sign-in failed
                                    </p>
                                    <p className="mt-1 text-red-600 dark:text-red-400">
                                        {authError}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-900/40"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {/* ─── Loading indicator ──── */}
                            {isLoading && activeMethod && !authError ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                                    Finishing sign-in. This should only take a
                                    moment.
                                </div>
                            ) : null}

                            {/* ─── Login Options ──────── */}
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleWalletLogin}
                                    disabled={!!activeMethod || isLoading}
                                    className="w-full rounded-lg bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
                                >
                                    {activeMethod === "wallet" && !authError ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Connecting...
                                        </span>
                                    ) : (
                                        <>
                                            <Wallet className="inline h-5 w-5 mr-2 -ml-1 text-white" />
                                            Continue with Wallet
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={!!activeMethod || isLoading}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950"
                                >
                                    {activeMethod === "google" && !authError ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                                            Connecting...
                                        </span>
                                    ) : (
                                        <>
                                            <GoogleIcon className="inline h-5 w-5 mr-2 -ml-1" />
                                            Continue with Google
                                        </>
                                    )}
                                </button>

                                <div className="relative flex items-center py-2">
                                    <div className="grow border-t border-slate-200 dark:border-slate-800" />
                                    <span className="shrink-0 px-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950">
                                        Or continue with email
                                    </span>
                                    <div className="grow border-t border-slate-200 dark:border-slate-800" />
                                </div>

                                <LoginWithEmail />
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
            <div className="relative hidden lg:flex items-center justify-center bg-[#0d1128] overflow-hidden min-h-screen">
                {/* 1. Ambient background glows */}
                <div className="absolute top-1/4 left-1/4 w-100 h-100 bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-112.5 h-112.5 bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-50 h-50 bg-yellow-300/10 blur-[80px] rounded-full pointer-events-none" />

                {/* 2. THE ASCII ANIMATION LAYER */}
                <div
                    className="absolute inset-0 flex items-center justify-center z-0"
                    style={{
                        maskImage:
                            "radial-gradient(circle, black 30%, transparent 80%)",
                        WebkitMaskImage:
                            "radial-gradient(circle, black 30%, transparent 80%)",
                    }}
                >
                    <MatrixRain />
                </div>

                {/* 3. Gradient Overlay for depth */}
                <div className="absolute inset-0 bg-linear-to-t from-[#0d1128] via-transparent to-transparent z-10 pointer-events-none" />

                {/* 4. Text Content */}
                <div className="absolute bottom-10 left-10 right-10 z-20">
                    <blockquote className="space-y-2 text-cyan-50">
                        <p className="text-lg font-medium leading-relaxed max-w-md">
                            &ldquo;Securely access Obelisk — a
                            blockchain-powered humanity archive preserving
                            identity, authenticity, and digital legacy for
                            future generations.&rdquo;
                        </p>
                        <footer className="text-sm font-semibold text-cyan-400/80 tracking-wide uppercase">
                            — OneDev PH
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
