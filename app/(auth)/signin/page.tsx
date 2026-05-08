"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// ─────────────────────────────────────────────────────
// Login Page — Privy-based social auth
//
// Three login methods: Google, Apple, Email
// No passwords, no seed phrases, no crypto UI
// Wallet creation happens silently in the background
// ─────────────────────────────────────────────────────

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading } = useAuth();
    const [activeMethod, setActiveMethod] = useState<string | null>(null);

    // Redirect once authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.push("/");
        }
    }, [isAuthenticated, isLoading, router]);

    const handleLogin = (method: string) => {
        setActiveMethod(method);
        login();
    };

    // Show loading state while checking auth
    if (isLoading && !activeMethod) {
        return (
            <div className="grid min-h-svh place-items-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                    <p className="text-sm text-slate-500">Loading...</p>
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
                            alt="Obelisk Logo"
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
                                    Welcome to Obelisk
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Sign in to archive your humanity — verify
                                    your moments and build your legacy.
                                </p>
                            </div>

                            {/* ─── Login Buttons ──────── */}
                            <div className="flex flex-col gap-3">
                                {/* Google */}
                                <button
                                    id="login-google"
                                    type="button"
                                    onClick={() => handleLogin("google")}
                                    disabled={!!activeMethod}
                                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950"
                                >
                                    {activeMethod === "google" ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                    )}
                                    Continue with Google
                                </button>

                                {/* Apple */}
                                <button
                                    id="login-apple"
                                    type="button"
                                    onClick={() => handleLogin("apple")}
                                    disabled={!!activeMethod}
                                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950"
                                >
                                    {activeMethod === "apple" ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="h-5 w-5"
                                            fill="currentColor"
                                        >
                                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                        </svg>
                                    )}
                                    Continue with Apple
                                </button>

                                {/* Divider */}
                                <div className="relative flex items-center py-2">
                                    <div className="grow border-t border-slate-200 dark:border-slate-800" />
                                    <span className="shrink-0 px-3 text-xs text-slate-400 dark:text-slate-500">
                                        or
                                    </span>
                                    <div className="grow border-t border-slate-200 dark:border-slate-800" />
                                </div>

                                {/* Email */}
                                <button
                                    id="login-email"
                                    type="button"
                                    onClick={() => handleLogin("email")}
                                    disabled={!!activeMethod}
                                    className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
                                >
                                    {activeMethod === "email" ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Connecting...
                                        </span>
                                    ) : (
                                        "Continue with Email"
                                    )}
                                </button>
                            </div>

                            {/* ─── Footer ──────────────── */}
                            <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                                By continuing, you agree to our Terms of Service
                                and Privacy Policy. Your identity is secured on
                                the blockchain.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── VISUAL SECTION ───────────────────── */}
            <div className="relative hidden lg:flex items-center justify-center bg-[#0d1128] overflow-hidden">
                {/* Ambient background glows */}
                <div className="absolute top-1/4 left-1/4 w-100 h-100 bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-112.5 h-112.5 bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-50 h-50 bg-yellow-300/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1128] via-transparent to-transparent z-10 pointer-events-none" />

                {/* Content */}
                <div className="relative z-20 text-center px-12">
                    <div className="mb-8">
                        <Image
                            src="/obelisk_logo.png"
                            alt="Obelisk"
                            width={120}
                            height={120}
                            className="mx-auto opacity-90"
                        />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                        Humanity Archive
                    </h2>
                    <p className="text-cyan-200/80 text-lg leading-relaxed max-w-sm mx-auto">
                        Every moment verified. Every memory permanent. Your
                        authentic human legacy, preserved forever.
                    </p>
                </div>

                {/* Bottom quote */}
                <div className="absolute bottom-10 left-10 right-10 z-20">
                    <blockquote className="space-y-2 text-cyan-50">
                        <p className="text-sm font-medium leading-relaxed opacity-70">
                            &ldquo;A blockchain-powered archive preserving
                            identity, authenticity, and digital legacy for
                            future generations.&rdquo;
                        </p>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
