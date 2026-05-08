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
    Check,
    X,
    AtSign,
} from "lucide-react";
import { toastSuccess, toastError } from "@/utils/Toast";

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

const ALL_COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
    "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// ─────────────────────────────────────────────────────
// Onboarding Page — 3 steps
// ─────────────────────────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();

    const [step, setStep] = useState(0);
    const [handle, setHandle] = useState("");
    const [handleStatus, setHandleStatus] = useState<
        "idle" | "checking" | "available" | "taken" | "invalid"
    >("idle");
    const [country, setCountry] = useState("");
    const [pillars, setPillars] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const togglePillar = (id: string) => {
        setPillars((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    // Handle validation regex (must match backend)
    const HANDLE_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

    // Debounced handle availability check
    useEffect(() => {
        if (!handle || handle.length < 3) {
            setHandleStatus(handle.length > 0 ? "invalid" : "idle");
            return;
        }
        if (!HANDLE_REGEX.test(handle)) {
            setHandleStatus("invalid");
            return;
        }

        setHandleStatus("checking");
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/onboarding/check-handle?handle=${encodeURIComponent(handle)}`
                );
                const data = await res.json();
                setHandleStatus(data.available ? "available" : "taken");
            } catch {
                setHandleStatus("idle");
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [handle]);

    // Guard: redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/signin");
        }
    }, [isLoading, isAuthenticated, router]);

    // Guard: redirect if already onboarded
    useEffect(() => {
        if (!isLoading && user?.handle) {
            router.replace("/dashboard");
        }
    }, [isLoading, user, router]);

    const handleComplete = async () => {
        setSaving(true);

        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    handle,
                    country,
                    pillarPreference: pillars,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                toastError(
                    data?.error ?? "Failed to save profile. Please try again."
                );
                return;
            }

            toastSuccess("Profile created successfully!");
            router.replace("/dashboard");
        } catch {
            toastError("Network error. Please try again.");
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

    const canProceedStep0 = handleStatus === "available";
    const canProceedStep1 = country.length > 0;
    const canFinish = pillars.length > 0;

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

                        {/* ── Step 0: Handle ──────────────── */}
                        {step === 0 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    Choose your handle
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    This is your unique identity in the Obelisk
                                    archive. It can&apos;t be changed later.
                                </p>

                                <div className="mt-8">
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Handle
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <AtSign className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={handle}
                                            onChange={(e) =>
                                                setHandle(
                                                    e.target.value
                                                        .toLowerCase()
                                                        .replace(/[^a-z0-9_]/g, "")
                                                )
                                            }
                                            maxLength={20}
                                            placeholder="rin"
                                            className={`w-full rounded-lg border bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-600 ${
                                                handleStatus === "available"
                                                    ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                                                    : handleStatus === "taken" ||
                                                        handleStatus === "invalid"
                                                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                                      : "border-slate-300 focus:border-cyan-500 focus:ring-cyan-500/20 dark:border-slate-800"
                                            }`}
                                        />
                                        {/* Status icon */}
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            {handleStatus === "checking" && (
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                            )}
                                            {handleStatus === "available" && (
                                                <Check className="h-4 w-4 text-emerald-500" />
                                            )}
                                            {(handleStatus === "taken" ||
                                                handleStatus === "invalid") && (
                                                <X className="h-4 w-4 text-red-400" />
                                            )}
                                        </div>
                                    </div>
                                    {/* Status message */}
                                    <div className="mt-2 h-5">
                                        {handleStatus === "available" && (
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                @{handle} is available!
                                            </p>
                                        )}
                                        {handleStatus === "taken" && (
                                            <p className="text-xs text-red-500">
                                                @{handle} is already taken
                                            </p>
                                        )}
                                        {handleStatus === "invalid" &&
                                            handle.length > 0 && (
                                                <p className="text-xs text-red-500">
                                                    3-20 chars, starts with a
                                                    letter, lowercase +
                                                    underscores only
                                                </p>
                                            )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={!canProceedStep0}
                                    onClick={() => setStep(1)}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
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

                                <div className="mt-8">
                                    <label
                                        htmlFor="country-input"
                                        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                                    >
                                        Country of Residence
                                    </label>
                                    <input
                                        id="country-input"
                                        type="text"
                                        list="countries-list"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        placeholder="Start typing your country..."
                                        className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500"
                                        autoComplete="off"
                                    />
                                    <datalist id="countries-list">
                                        {ALL_COUNTRIES.map((c) => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        You can select from the list or type your own.
                                    </p>
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
                                        const isSelected = pillars.includes(p.id);
                                        const Icon = p.icon;

                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => togglePillar(p.id)}
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
                            — OneDev PH
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
