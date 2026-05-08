"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="grid min-h-svh lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans">
            {/* --- FORM SECTION --- */}
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
                        <form className="flex flex-col gap-6">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    Access Portal
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Enter your credentials to connect to the
                                    network
                                </p>
                            </div>

                            <div className="flex flex-col gap-5">
                                {/* Email Field */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="example@gmail.com"
                                        required
                                        className="block w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        required
                                        placeholder="••••••••"
                                        // Notice the pr-12 here to make room for the icon
                                        className="block w-full rounded-md border border-slate-300 bg-white pl-4 pr-12 py-2 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-cyan-600 focus:outline-none dark:text-slate-500 dark:hover:text-cyan-400 transition-colors"
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword ? (
                                            // Eye Off Icon
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                <line
                                                    x1="2"
                                                    x2="22"
                                                    y1="2"
                                                    y2="22"
                                                />
                                            </svg>
                                        ) : (
                                            // Eye Icon
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Primary Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full rounded-md bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3   text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                                >
                                    Login
                                </button>

                                {/* Divider */}
                                <div className="relative flex items-center py-2">
                                    <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                                    <span className="shrink-0 px-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950">
                                        Or continue with
                                    </span>
                                    <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                                </div>

                                {/* Google Button */}
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-center rounded-md border border-slate-300 bg-transparent px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 dark:focus:ring-offset-slate-950"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        className="mr-2 h-5 w-5"
                                    >
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.493-.16-2.187z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Login with Google
                                </button>
                            </div>

                            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/signup"
                                    className="font-semibold text-indigo-600 hover:text-cyan-500 dark:text-indigo-400 dark:hover:text-cyan-400 transition-colors"
                                >
                                    Sign up
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* --- VISUAL SECTION --- */}
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
