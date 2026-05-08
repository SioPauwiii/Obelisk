"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "@/components/camera/Camera";
import {
    ArrowLeft,
    UploadCloud,
    MapPin,
    Loader2,
    Check,
    Dna,
    BookOpen,
    Palette,
    Globe,
    Rocket,
    HeartHandshake,
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

type CaptureStep = "camera" | "describe" | "archiving" | "done";

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

type CapturedMoment = {
    id: string;
    blob: Blob;
    proof: ProofPayload;
    imageUrl: string;
};

export default function CapturePage() {
    const router = useRouter();

    const [step, setStep] = useState<CaptureStep>("camera");
    const [captures, setCaptures] = useState<CapturedMoment[]>([]);
    const [selectedCaptureIds, setSelectedCaptureIds] = useState<string[]>([]);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Describe form state
    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [pillar, setPillar] = useState("");
    const [locationName, setLocationName] = useState("");
    const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);

    // Archive result
    const [archiveResult, setArchiveResult] = useState<{
        imageHashes: string[];
        proofHashes: string[];
        imageUrls: string[];
        proofUrls: string[];
    } | null>(null);
    const [archiveProgress, setArchiveProgress] = useState("");

    const selectedCaptures = captures.filter((capture) =>
        selectedCaptureIds.includes(capture.id),
    );
    const activeCapture =
        selectedCaptures[0] ?? captures[captures.length - 1] ?? null;

    // ── Camera capture handler ────────────────────────
    const handleCapture = ({
        blob,
        proof,
    }: {
        blob: Blob;
        proof: ProofPayload;
    }) => {
        const id = crypto.randomUUID();
        const imageUrl = URL.createObjectURL(blob);
        setCaptures((current) => [...current, { id, blob, proof, imageUrl }]);
        setSelectedCaptureIds((current) =>
            current.includes(id) ? current : [...current, id],
        );
        setStep("camera");
    };

    const handleOpenGallery = () => {
        if (!captures.length) return;
        setIsGalleryOpen(true);
    };

    const handleToggleCapture = (id: string) => {
        setSelectedCaptureIds((current) =>
            current.includes(id)
                ? current.filter((captureId) => captureId !== id)
                : [...current, id],
        );
    };

    const handleRemoveCapture = (id: string) => {
        setCaptures((current) => {
            const target = current.find((capture) => capture.id === id);
            if (target) URL.revokeObjectURL(target.imageUrl);

            const next = current.filter((capture) => capture.id !== id);
            setSelectedCaptureIds((currentSelected) =>
                currentSelected.filter((captureId) => captureId !== id),
            );
            if (!next.length) {
                setIsGalleryOpen(false);
            }
            return next;
        });
    };

    const handlePostSelected = () => {
        if (!selectedCaptures.length) return;
        setIsGalleryOpen(false);
        setStep("describe");
    };

    // ── Auto-geocode when entering describe ───────────
    useEffect(() => {
        if (step !== "describe" || !activeCapture) return;

        const loc = activeCapture.proof.payload.location;
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
    }, [step, activeCapture]);

    // ── Reset everything ──────────────────────────────
    const handleReset = () => {
        captures.forEach((capture) => URL.revokeObjectURL(capture.imageUrl));
        setCaptures([]);
        setSelectedCaptureIds([]);
        setIsGalleryOpen(false);
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
        if (!selectedCaptures.length || !title || !pillar) return;

        setStep("archiving");

        try {
            // 1. Upload to Lighthouse
            setArchiveProgress("Uploading to IPFS...");
            const { archiveMoments } = await import("@/lib/utils/storage");
            const result = await archiveMoments(
                selectedCaptures.map((capture) => ({
                    blob: capture.blob,
                    proof: capture.proof,
                    label: capture.proof.payload.hash ?? capture.id,
                })),
            );
            setArchiveResult(result);

            console.log("[Capture] Archive result:", {
                imageHashes: result.imageHashes,
                imageUrls: result.imageUrls,
                proofHashes: result.proofHashes,
                proofUrls: result.proofUrls,
            });

            // 2. Save to Supabase
            setArchiveProgress("Saving to archive...");
            const proof = activeCapture?.proof;
            if (!proof) {
                throw new Error("No selected capture available for archiving");
            }
            const postPayload = {
                title,
                caption,
                pillar,
                locationName,
                latitude: proof.payload.location?.latitude,
                longitude: proof.payload.location?.longitude,
                imageCid: result.imageHashes[0],
                proofCid: result.proofHashes[0],
                imageUrl: result.imageUrls[0],
                proofUrl: result.proofUrls[0],
                imageCids: result.imageHashes,
                proofCids: result.proofHashes,
                imageUrls: result.imageUrls,
                proofUrls: result.proofUrls,
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
            {step === "camera" && (
                <Camera
                    onCapture={handleCapture}
                    capturedImageUrl={activeCapture?.imageUrl ?? null}
                    onOpenArchive={handleOpenGallery}
                    onRetake={handleReset}
                />
            )}

            {isGalleryOpen && (
                <div className="absolute inset-0 z-60 bg-black/80 backdrop-blur-xl px-4 py-6 overflow-y-auto">
                    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                                    Gallery
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-white">
                                    Pick a photo to post
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsGalleryOpen(false)}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {captures.map((capture) => {
                                const selected = selectedCaptureIds.includes(
                                    capture.id,
                                );
                                return (
                                    <div
                                        key={capture.id}
                                        className={cn(
                                            "group relative overflow-hidden rounded-2xl border bg-white/5",
                                            selected
                                                ? "border-emerald-400/70 ring-2 ring-emerald-400/30"
                                                : "border-white/10",
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleToggleCapture(capture.id)
                                            }
                                            className="block w-full"
                                        >
                                            <Image
                                                src={capture.imageUrl}
                                                alt="Gallery capture"
                                                width={800}
                                                height={1000}
                                                className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                                unoptimized
                                            />
                                        </button>
                                        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                            {selected
                                                ? "Selected"
                                                : "Tap to select"}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveCapture(capture.id)
                                            }
                                            className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/80 transition-colors hover:bg-red-500 hover:text-white"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="sticky bottom-0 mt-2 flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-white/70">
                                {selectedCaptures.length > 0
                                    ? `${selectedCaptures.length} image${selectedCaptures.length === 1 ? "" : "s"} selected for posting`
                                    : "No image selected"}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                >
                                    Clear All
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePostSelected}
                                    disabled={!selectedCaptures.length}
                                    className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Post Selected
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step: Describe Your Moment ───────────── */}
            {step === "describe" && activeCapture && (
                <div className="flex-1 flex flex-col items-center justify-start pt-24 px-6 pb-6 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="w-full max-w-sm space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                Describe Moment
                            </h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Add context to your verified captures before
                                archiving them permanently.
                            </p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
                                {selectedCaptures.length} image
                                {selectedCaptures.length === 1 ? "" : "s"}{" "}
                                selected
                            </p>
                        </div>

                        {/* Thumbnail preview */}
                        {activeCapture && (
                            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-sm">
                                <Image
                                    src={activeCapture.imageUrl}
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
                                Category{" "}
                                <span className="text-indigo-500">*</span>
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
                                    onChange={(e) =>
                                        setLocationName(e.target.value)
                                    }
                                    placeholder={
                                        isGeocodingLocation
                                            ? "Detecting location..."
                                            : "Location name"
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
                                onClick={() => setStep("camera")}
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
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-65 mx-auto leading-relaxed">
                            {archiveResult.imageUrls.length} image
                            {archiveResult.imageUrls.length === 1 ? "" : "s"}{" "}
                            archived on the decentralized web.
                        </p>
                    </div>

                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-5 space-y-4 shadow-sm">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    IPFS CID
                                </span>
                                <a
                                    href={archiveResult.imageUrls[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline truncate max-w-40 transition-colors"
                                >
                                    {archiveResult.imageHashes[0]}
                                </a>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Proof Link
                                </span>
                                <a
                                    href={archiveResult.proofUrls[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline truncate max-w-40 transition-colors flex items-center gap-1"
                                >
                                    view_proof.json
                                    <ArrowUpRight className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </span>
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
