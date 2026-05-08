"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "@/components/camera/Camera";
import {
    ShieldCheck,
    ArrowLeft,
    UploadCloud,
    MapPin,
    Clock,
    Hash,
    Loader2,
    Check,
    Dna,
    BookOpen,
    Palette,
    Globe,
    Rocket,
    HeartHandshake,
    Database,
    ArrowUpRight,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { reverseGeocode } from "@/lib/utils/geocode";
import { toastSuccess, toastError } from "@/utils/Toast";

// ─────────────────────────────────────────────────────
// Pillar options (shared with onboarding)
// ─────────────────────────────────────────────────────
const PILLARS: { id: string; label: string; icon: LucideIcon }[] = [
    { id: "identity", label: "Identity", icon: Dna },
    { id: "knowledge", label: "Knowledge", icon: BookOpen },
    { id: "culture", label: "Culture", icon: Palette },
    { id: "environment", label: "Environment", icon: Globe },
    { id: "innovation", label: "Innovation", icon: Rocket },
    { id: "community", label: "Community", icon: HeartHandshake },
];

type CaptureStep = "camera" | "preview" | "describe" | "archiving" | "done";

type ProofPayload = {
    payload: {
        location?: { latitude?: number; longitude?: number } | null;
        sensors: { orientationDelta: number };
        hash?: string;
        timestamp?: number;
        [k: string]: unknown;
    };
    [k: string]: unknown;
};

export default function CapturePage() {
    const router = useRouter();

    const [step, setStep] = useState<CaptureStep>("camera");
    const [capturedData, setCapturedData] = useState<{
        blob: Blob;
        proof: ProofPayload;
    } | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Describe form state
    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [pillar, setPillar] = useState("");
    const [locationName, setLocationName] = useState("");
    const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);

    // Archive result
    const [archiveResult, setArchiveResult] = useState<{
        imageHash: string;
        proofHash: string;
        imageUrl: string;
        proofUrl: string;
    } | null>(null);
    const [archiveProgress, setArchiveProgress] = useState("");

    // ── Camera capture handler ────────────────────────
    const handleCapture = ({
        blob,
        proof,
    }: {
        blob: Blob;
        proof: ProofPayload;
    }) => {
        setCapturedData({ blob, proof });
        setImageUrl(URL.createObjectURL(blob));
        setStep("preview");
    };

    // ── Auto-geocode when entering preview ────────────
    useEffect(() => {
        if (step !== "preview" || !capturedData) return;

        const loc = capturedData.proof.payload.location;
        if (
            loc &&
            typeof loc.latitude === "number" &&
            typeof loc.longitude === "number"
        ) {
            let mounted = true;
            const lat = loc.latitude;
            const lon = loc.longitude;
            // defer state update to avoid sync setState inside effect
            const id = window.setTimeout(() => {
                if (!mounted) return;
                setIsGeocodingLocation(true);
                reverseGeocode(lat, lon)
                    .then((name) => {
                        if (!mounted) return;
                        if (name) setLocationName(name);
                    })
                    .catch(() => {})
                    .finally(() => {
                        if (!mounted) return;
                        setIsGeocodingLocation(false);
                    });
            }, 0);

            return () => {
                mounted = false;
                clearTimeout(id);
            };
        }
    }, [step, capturedData]);

    // ── Reset everything ──────────────────────────────
    const handleReset = () => {
        setCapturedData(null);
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
        setArchiveResult(null);
        setTitle("");
        setCaption("");
        setPillar("");
        setLocationName("");
        setArchiveProgress("");
        setStep("camera");
    };

    // ── Archive + Save ────────────────────────────────
    const handleArchive = async () => {
        if (!capturedData || !title || !pillar) return;

        setStep("archiving");

        try {
            // 1. Upload to Lighthouse
            setArchiveProgress("Uploading to IPFS...");
            const { archiveMoment } = await import("@/lib/utils/storage");
            const result = await archiveMoment(
                capturedData.blob,
                capturedData.proof,
            );
            setArchiveResult(result);

            console.log("[Capture] Archive result:", {
                imageHash: result.imageHash,
                imageUrl: result.imageUrl,
                proofHash: result.proofHash,
                proofUrl: result.proofUrl,
            });

            // 2. Save to Supabase
            setArchiveProgress("Saving to archive...");
            const proof = capturedData.proof;
            const postPayload = {
                title,
                caption,
                pillar,
                locationName,
                latitude: proof.payload.location?.latitude,
                longitude: proof.payload.location?.longitude,
                imageCid: result.imageHash,
                proofCid: result.proofHash,
                imageUrl: result.imageUrl,
                proofUrl: result.proofUrl,
                livenessScore: proof.payload.sensors.orientationDelta,
                capturedAt:
                    typeof proof.payload.timestamp === "number"
                        ? new Date(proof.payload.timestamp).toISOString()
                        : new Date().toISOString(),
            };

            console.log("[Capture] Posting to /api/posts:", postPayload);

            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postPayload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.error ?? "Failed to save post");
            }

            const postResult = await res.json();
            console.log("[Capture] Post created successfully:", postResult);

            setArchiveProgress("Done!");
            toastSuccess(
                "Moment Archived",
                "Your verified human moment is now permanently stored.",
            );
            setStep("done");
        } catch (err) {
            console.error("Archival failed:", err);
            const error = err as Error | null;
            toastError(
                "Archive Failed",
                (error && error.message) ||
                    String(err) ||
                    "Something went wrong. Please try again.",
            );
            setStep("describe");
        }
    };

    const canArchive = title.trim().length >= 3 && pillar !== "";

    return (
        <main className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
                <Link
                    href="/feed"
                    className="p-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pointer-events-auto hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm text-slate-700 dark:text-slate-300"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>

            {/* ── Step: Camera ─────────────────────────── */}
            {step === "camera" && <Camera onCapture={handleCapture} />}

            {/* ── Step: Preview ─────────────────────────── */}
            {step === "preview" && capturedData && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
                    <div className="relative group max-w-sm w-full aspect-[4/5] rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
                        {/* Image */}
                        {imageUrl && (
                            <div className="absolute inset-0 w-full h-full">
                                <Image
                                    src={imageUrl}
                                    alt="Captured"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    unoptimized
                                />
                            </div>
                        )}
                        {/* Elegant Vignette */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-90" />

                        {/* Metadata Pills */}
                        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-2.5">
                            <div className="flex items-center gap-2 w-max px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                    {typeof capturedData.proof.payload.location?.latitude === "number"
                                        ? `${capturedData.proof.payload.location.latitude.toFixed(4)}, ${capturedData.proof.payload.location.longitude?.toFixed(4)}`
                                        : "Detecting Location..."}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 w-max px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700">
                                <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                    {typeof capturedData.proof.payload.timestamp === "number"
                                        ? new Date(capturedData.proof.payload.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                        : "Unknown Time"}
                                </span>
                            </div>
                        </div>

                        {/* Verification Badge */}
                        <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 backdrop-blur-xl border border-emerald-200 dark:border-emerald-500/40 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                Verified Live
                            </span>
                        </div>
                    </div>

                    {/* Proof summary Card */}
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 overflow-hidden shadow-sm">
                        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20">
                                    <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cryptographic Proof</h3>
                            </div>
                            <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="relative z-10 space-y-3 pt-4">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Image Hash</span>
                                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                                    {capturedData.proof.payload.hash || "Pending..."}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Liveness Delta</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300">
                                        Δ {capturedData.proof.payload.sensors.orientationDelta.toFixed(2)}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 text-[9px] font-bold uppercase tracking-wide">Pass</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full max-w-sm pt-2">
                        <button
                            onClick={handleReset}
                            className="flex-1 py-3.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] text-sm tracking-wide"
                        >
                            RETAKE
                        </button>
                        <button
                            onClick={() => setStep("describe")}
                            className="flex-2 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-sm tracking-wide"
                        >
                            CONTINUE
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step: Describe Your Moment ───────────── */}
            {step === "describe" && capturedData && (
                <div className="flex-1 flex flex-col items-center justify-start pt-24 px-6 pb-6 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="w-full max-w-sm space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                Describe Moment
                            </h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Add context to your verified capture before archiving it permanently.
                            </p>
                        </div>

                        {/* Thumbnail preview */}
                        {imageUrl && (
                            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-sm">
                                <Image
                                    src={imageUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/5 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-2xl" />
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                Title <span className="text-indigo-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Coastal Cleanup Morning"
                                maxLength={100}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm"
                            />
                            <p className="mt-1.5 text-right text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {title.length}/100
                            </p>
                        </div>

                        {/* Caption */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                Caption
                            </label>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="What's happening in this moment?"
                                maxLength={500}
                                rows={3}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none shadow-sm"
                            />
                            <p className="mt-1.5 text-right text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {caption.length}/500
                            </p>
                        </div>

                        {/* Pillar selector */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                Category <span className="text-indigo-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PILLARS.map((p) => {
                                    const Icon = p.icon;
                                    const isSelected = pillar === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setPillar(p.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shadow-sm",
                                                isSelected
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500/30"
                                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    placeholder={
                                        isGeocodingLocation ? "Detecting location..." : "Location name"
                                    }
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm"
                                />
                                {isGeocodingLocation && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-6 pb-8">
                            <button
                                onClick={() => setStep("preview")}
                                className="flex-1 py-3.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] text-sm tracking-wide"
                            >
                                BACK
                            </button>
                            <button
                                onClick={handleArchive}
                                disabled={!canArchive}
                                className="flex-2 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-sm tracking-wide"
                            >
                                <UploadCloud className="w-4 h-4" />
                                ARCHIVE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step: Archiving (Progress) ───────────── */}
            {step === "archiving" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-300">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative z-10 w-20 h-20 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        </div>
                    </div>
                    <div className="text-center space-y-3">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            Archiving...
                        </h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                            {archiveProgress}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Step: Done (Success) ─────────────────── */}
            {step === "done" && archiveResult && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                        <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-full blur-[30px] animate-pulse" />
                        <div className="relative z-10 w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shadow-sm border-2 border-emerald-200 dark:border-emerald-500/30">
                            <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            Archived
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[260px] mx-auto leading-relaxed">
                            Your verified human moment is now permanently stored on the decentralized web.
                        </p>
                    </div>

                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 space-y-4 shadow-sm">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">IPFS CID</span>
                                <a
                                    href={archiveResult.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline truncate max-w-[160px] transition-colors"
                                >
                                    {archiveResult.imageHash}
                                </a>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Proof Link</span>
                                <a
                                    href={archiveResult.proofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline truncate max-w-[160px] transition-colors flex items-center gap-1"
                                >
                                    view_proof.json
                                    <ArrowUpRight className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</span>
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-widest">
                                    Permanent
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full max-w-sm pt-4">
                        <button
                            onClick={handleReset}
                            className="flex-1 py-3.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] text-sm tracking-wide"
                        >
                            CAPTURE NEW
                        </button>
                        <button
                            onClick={() => router.push("/feed")}
                            className="flex-2 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-sm tracking-wide"
                        >
                            VIEW IN FEED
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
