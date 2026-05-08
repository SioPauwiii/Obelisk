"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArchiveNetwork } from "@/components/UI/ArchiveNetwork";

export default function TermsOfServicePage() {
    return (
        <div className="grid h-svh lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans">
            {/* ─── CONTENT SECTION (Scrollable) ─────────────── */}
            <div className="flex h-full flex-col p-6 md:p-10 relative overflow-y-auto z-10">
                <div className="max-w-2xl w-full mx-auto ">
                    <Link
                        href="/signin"
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </Link>

                    <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
                        Terms of Service
                    </h1>

                    <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                1. Introduction
                            </h2>
                            <p>
                                Welcome to Obelisk. By accessing or using our
                                platform, you agree to be bound by these Terms
                                of Service. If you do not agree to these terms,
                                please do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                2. User Accounts and Identity
                            </h2>
                            <p>
                                When you create an account, you must provide a
                                unique handle and connect a valid wallet or
                                social account. You are responsible for
                                safeguarding your authentication credentials. We
                                reserve the right to reclaim handles that
                                violate our guidelines or remain inactive for
                                extended periods.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                3. The Humanity Archive
                            </h2>
                            <p>
                                Obelisk is designed to preserve human history.
                                Content submitted to the archive must be
                                authentic and align with our core pillars. We
                                strictly prohibit the submission of malicious,
                                illegal, or synthetically generated content
                                designed to deceive.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                4. Blockchain and Immutability
                            </h2>
                            <p>
                                Certain actions on Obelisk involve interactions
                                with blockchain networks. You acknowledge that
                                blockchain transactions are inherently
                                immutable. Once data is permanently archived, it
                                cannot be altered or deleted. You are solely
                                responsible for ensuring you have the right to
                                archive any content you submit.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                5. Termination
                            </h2>
                            <p>
                                We may terminate or suspend your access to the
                                platform immediately, without prior notice or
                                liability, for any reason whatsoever, including
                                without limitation if you breach the Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                6. Changes to Terms
                            </h2>
                            <p>
                                We reserve the right to modify these terms at
                                any time. We will notify users of significant
                                changes. Your continued use of the platform
                                after such modifications constitutes your
                                acknowledgment and acceptance of the updated
                                terms.
                            </p>
                        </section>

                        <div className="pt-6 mt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
                            Last updated: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── VISUAL SECTION (Redesigned) ─────────── */}
            <div className="relative hidden lg:flex h-full flex-col justify-between bg-slate-950 overflow-hidden p-12">
                {/* Atmospheric Mesh Gradient Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-900/40 blur-[150px]" />
                    <div className="absolute top-[40%] right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-900/30 blur-[120px]" />
                    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-950/50 blur-[150px]" />
                </div>

                {/* The Animated Network (Middle Layer) */}
                <ArchiveNetwork />

                {/* Vertical "Archive Ledger" Line (Subtle Obelisk motif) */}
                <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
                <div className="absolute left-12 top-1/2 -translate-y-1/2 w-1 h-32 bg-cyan-500/40 blur-[2px] rounded-full" />
                <div className="absolute left-[47px] top-1/2 -translate-y-1/2 w-[2px] h-16 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.6)]" />

                {/* Top Branding */}
                <div className="relative z-10 pl-8">
                    <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">
                        Legal Protocol
                    </span>
                </div>

                {/* Center Cinematic Typography */}
                <div className="relative z-10 pl-8 max-w-lg pointer-events-none">
                    <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight leading-tight mb-6">
                        Preserving truth in a <br />
                        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            synthetic era.
                        </span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed font-light">
                        Our rules are as foundational as the archive itself. We
                        maintain a secure, authentic environment for the
                        preservation of human history.
                    </p>
                </div>

                {/* Subtle Grain Overlay (Optional, gives a textured, premium feel) */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>
        </div>
    );
}
