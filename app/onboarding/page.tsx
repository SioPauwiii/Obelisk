"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { MatrixRain } from "@/components/UI/MatrixRain";
import {
    Dna,
    BookOpen,
    Palette,
    Globe,
    Rocket,
    HeartHandshake,
    ArrowRight,
    ArrowLeft,
    Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────
// Pillar options matching the Humanity Archive concept
// ─────────────────────────────────────────────────────
const PILLARS = [
    {
        id: "identity",
        label: "Identity & Heritage",
        icon: Dna,
        description: "Preserve personal and cultural identity",
    },
    {
        id: "knowledge",
        label: "Knowledge & Education",
        icon: BookOpen,
        description: "Archive humanity's collective wisdom",
    },
    {
        id: "culture",
        label: "Culture & Traditions",
        icon: Palette,
        description: "Document rituals, art, and traditions",
    },
    {
        id: "environment",
        label: "Earth & Environment",
        icon: Globe,
        description: "Record our relationship with the planet",
    },
    {
        id: "innovation",
        label: "Innovation & Technology",
        icon: Rocket,
        description: "Chronicle breakthroughs and progress",
    },
    {
        id: "community",
        label: "Community & Legacy",
        icon: HeartHandshake,
        description: "Capture stories of human connection",
    },
];

const COUNTRIES = [
    "Philippines",
    "United States",
    "Japan",
    "South Korea",
    "Singapore",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "India",
    "Brazil",
    "Other",
];

// ─────────────────────────────────────────────────────
// Onboarding Page — 3 steps
// ─────────────────────────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();

    const [step, setStep] = useState(0);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [country, setCountry] = useState("");
    const [pillar, setPillar] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Guard: redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/signin");
        }
    }, [isLoading, isAuthenticated, router]);

    // Guard: redirect if already onboarded
    useEffect(() => {
        if (!isLoading && user?.full_name) {
            router.replace("/dashboard");
        }
    }, [isLoading, user, router]);

    const handleComplete = async () => {
        setSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    country,
                    pillarPreference: pillar,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setError(
                    data?.error ?? "Failed to save profile. Please try again.",
                );
                return;
            }

            router.replace("/dashboard");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="grid h-svh place-items-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <p className="text-sm text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    const canProceedStep0 =
        firstName.trim().length >= 2 && lastName.trim().length >= 1;
    const canProceedStep1 = country.length > 0;
    const canFinish = pillar.length > 0;

    return (
        // Changed min-h-svh to h-svh to lock the outer grid strictly to the viewport height
        <div className="grid h-svh lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans">
            {/* ─── FORM SECTION (Scrollable) ─────────────── */}
            {/* Added h-full and overflow-y-auto so ONLY this column scrolls */}
            <div className="flex h-full flex-col gap-4 p-6 md:p-10 relative overflow-y-auto">
                {/* Header Logo */}
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

                <div className="flex flex-1 items-center justify-center py-8">
                    <div className="w-full max-w-md">
                        {/* Progress bar */}
                        <div className="mb-10">
                            <div className="flex gap-2 mb-3">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                                            i <= step
                                                ? "bg-linear-to-r from-indigo-500 to-cyan-500"
                                                : "bg-slate-200 dark:bg-slate-800"
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider text-right">
                                Step {step + 1} of 3
                            </p>
                        </div>

                        {/* ── Step 0: Name ─────────────────── */}
                        {step === 0 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    Welcome to Obelisk
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Let&apos;s set up your archive identity.
                                    What should we call you?
                                </p>

                                <div className="mt-8 space-y-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) =>
                                                setFirstName(e.target.value)
                                            }
                                            placeholder="Juan"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) =>
                                                setLastName(e.target.value)
                                            }
                                            placeholder="Dela Cruz"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={!canProceedStep0}
                                    onClick={() => setStep(1)}
                                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
                                >
                                    Continue
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* ── Step 1: Country ──────────────── */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    Where are you from?
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    This helps connect you with local archives
                                    and contributors.
                                </p>

                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    {COUNTRIES.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setCountry(c)}
                                            className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                                                country === c
                                                    ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300 ring-1 ring-cyan-500"
                                                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300"
                                            }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(0)}
                                        className="flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!canProceedStep1}
                                        onClick={() => setStep(2)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
                                    >
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Pillar Preference ───── */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    Choose your pillar
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    What aspect of human legacy are you most
                                    passionate about preserving?
                                </p>

                                <div className="mt-8 space-y-3">
                                    {PILLARS.map((p) => {
                                        const isSelected = pillar === p.id;
                                        const Icon = p.icon;

                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setPillar(p.id)}
                                                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                                                    isSelected
                                                        ? "border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500 dark:bg-cyan-500/10"
                                                        : "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                                                }`}
                                            >
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                                        isSelected
                                                            ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400"
                                                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                                    }`}
                                                >
                                                    <Icon
                                                        className="h-6 w-6"
                                                        strokeWidth={1.5}
                                                    />
                                                </div>
                                                <div>
                                                    <p
                                                        className={`text-sm font-bold ${isSelected ? "text-cyan-700 dark:text-cyan-300" : "text-slate-900 dark:text-slate-200"}`}
                                                    >
                                                        {p.label}
                                                    </p>
                                                    <p
                                                        className={`text-xs mt-0.5 ${isSelected ? "text-cyan-600/80 dark:text-cyan-200/70" : "text-slate-500 dark:text-slate-400"}`}
                                                    >
                                                        {p.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {error && (
                                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!canFinish || saving}
                                        onClick={handleComplete}
                                        className="flex-1 rounded-lg bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
                                    >
                                        {saving ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                                                Saving...
                                            </span>
                                        ) : (
                                            "Complete Setup"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── VISUAL SECTION (Fixed) ─────────── */}
            {/* Changed min-h-screen to h-full so it perfectly fills the locked parent grid height */}
            <div className="relative hidden lg:flex h-full items-center justify-center bg-[#0d1128] overflow-hidden">
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
                            &ldquo;Establish your presence in the archive. Every
                            voice contributes to a permanent, immutable tapestry
                            of human history.&rdquo;
                        </p>
                        <footer className="text-sm font-semibold text-cyan-400/80 tracking-wide uppercase">
                            — Obelisk Initiative
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
