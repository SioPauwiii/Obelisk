"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArchiveNetwork } from "@/components/UI/ArchiveNetwork";

export default function PrivacyPolicyPage() {
    return (
        <div className="grid h-svh lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans">
            {/* ─── CONTENT SECTION (Scrollable) ─────────────── */}
            <div className="flex h-full flex-col p-6 md:p-10 relative overflow-y-auto z-10">
                <div className="max-w-2xl w-full mx-auto py-">
                    <Link
                        href="/signin"
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </Link>

                    <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
                        Privacy Policy
                    </h1>

                    <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                1. Information We Collect
                            </h2>
                            <p>
                                We collect information you provide directly to
                                us when creating an account, including your
                                chosen handle, country, and pillar preferences.
                                We also collect authentication data provided by
                                third-party services (such as wallet addresses
                                or social account identifiers) when you sign in.
                            </p>
                        </section>
                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                2. How We Use Your Information
                            </h2>
                            <p>
                                We use the information we collect to provide,
                                maintain, and improve the Obelisk platform. This
                                includes authenticating your identity,
                                personalizing your experience within the
                                archive, and communicating with you regarding
                                updates or security alerts.
                            </p>
                        </section>
                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                3. Blockchain Data Privacy
                            </h2>
                            <p>
                                Please be aware that any data or content you
                                explicitly choose to anchor or store on public
                                blockchain networks via our platform will be
                                permanently public. It is impossible for us to
                                delete or alter data once it has been
                                broadcasted to a decentralized network.
                            </p>
                        </section>
                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                4. Data Security
                            </h2>
                            <p>
                                We implement industry-standard security measures
                                to protect your personal information. However,
                                no method of transmission over the Internet or
                                electronic storage is 100% secure. We cannot
                                guarantee absolute security but strive to
                                protect your data using commercially acceptable
                                means.
                            </p>
                        </section>
                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                5. Third-Party Services
                            </h2>
                            <p>
                                We utilize third-party services such as Privy
                                for secure authentication and wallet management,
                                and Supabase for backend database
                                infrastructure. These services have their own
                                privacy policies governing how they handle the
                                data they process on our behalf.
                            </p>
                        </section>
                        <section>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                                6. Contact Us
                            </h2>
                            <p>
                                If you have any questions or concerns about our
                                Privacy Policy or how we handle your data,
                                please reach out to our support team.
                            </p>
                        </section>{" "}
                        <div className="pt-6 mt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
                            Last updated: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── VISUAL SECTION (Redesigned with Animation) ─────────── */}
            <div className="relative hidden lg:flex h-full flex-col justify-between bg-slate-950 overflow-hidden p-12">
                {/* 1. Atmospheric Mesh Gradient Background (Base Layer) */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-900/40 blur-[150px]" />
                    <div className="absolute top-[40%] right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-900/30 blur-[120px]" />
                    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-950/50 blur-[150px]" />
                </div>

                {/* 2. The Animated Network (Middle Layer) */}
                <ArchiveNetwork />

                {/* 3. Vertical "Archive Ledger" Line (UI Layer) */}
                <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
                <div className="absolute left-12 top-1/2 -translate-y-1/2 w-1 h-32 bg-cyan-500/40 blur-[2px] rounded-full" />
                <div className="absolute left-[47px] top-1/2 -translate-y-1/2 w-[2px] h-16 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.6)]" />

                {/* Top Branding */}
                <div className="relative z-10 pl-8">
                    <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">
                        Privacy Protocol
                    </span>
                </div>

                {/* Center Cinematic Typography */}
                <div className="relative z-10 pl-8 max-w-lg pointer-events-none">
                    <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight leading-tight mb-6">
                        Transparency by design, <br />
                        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            privacy by default.
                        </span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed font-light">
                        Transparency is our commitment. We protect your identity
                        while preserving the absolute integrity of the archive.
                    </p>
                </div>

                {/* Subtle Grain Overlay (Top Layer) */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>
        </div>
    );
}
