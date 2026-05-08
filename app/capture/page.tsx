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
        <main className="fixed inset-0 bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
                <Link
                    href="/feed"
                    className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 pointer-events-auto hover:bg-black/60 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
            </div>

            {/* ── Step: Camera ─────────────────────────── */}
            {step === "camera" && <Camera onCapture={handleCapture} />}

            {/* ── Step: Preview ─────────────────────────── */}
            {step === "preview" && capturedData && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="relative group max-w-md w-full aspect-3/4 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        {imageUrl && (
                            <div className="w-full h-full relative">
                                <Image
                                    src={imageUrl}
                                    alt="Captured"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        )}

                        {/* Metadata Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/80 to-transparent">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-cyan-400" />
                                    <span className="text-[10px] font-mono text-white/70">
                                        {typeof capturedData.proof.payload
                                            .location?.latitude === "number"
                                            ? capturedData.proof.payload.location.latitude.toFixed(
                                                  4,
                                              )
                                            : "—"}
                                        ,{" "}
                                        {typeof capturedData.proof.payload
                                            .location?.longitude === "number"
                                            ? capturedData.proof.payload.location.longitude.toFixed(
                                                  4,
                                              )
                                            : "—"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-cyan-400" />
                                    <span className="text-[10px] font-mono text-white/70">
                                        {typeof capturedData.proof.payload
                                            .timestamp === "number"
                                            ? new Date(
                                                  capturedData.proof.payload
                                                      .timestamp,
                                              ).toLocaleString()
                                            : "Unknown"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Verification Badge */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30">
                            <ShieldCheck className="w-3 h-3 text-green-400" />
                            <span className="text-[9px] font-mono font-bold text-green-400 uppercase tracking-tight">
                                Verified Live
                            </span>
                        </div>
                    </div>

                    {/* Proof summary */}
                    <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <h3 className="text-sm font-semibold text-white/90">
                                Proof of Capture
                            </h3>
                            <Hash className="w-4 h-4 text-white/30" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">
                                    Image Hash
                                </span>
                                <span className="text-[10px] font-mono text-white/60 truncate max-w-37.5">
                                    {capturedData.proof.payload.hash}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">
                                    Liveness Delta
                                </span>
                                <span className="text-[10px] font-mono text-green-400">
                                    {capturedData.proof.payload.sensors.orientationDelta.toFixed(
                                        2,
                                    )}{" "}
                                    (PASS)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full max-w-md">
                        <button
                            onClick={handleReset}
                            className="flex-1 py-4 bg-white/5 text-white/70 font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                        >
                            RETAKE
                        </button>
                        <button
                            onClick={() => setStep("describe")}
                            className="flex-2 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
                        >
                            CONTINUE
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step: Describe Your Moment ───────────── */}
            {step === "describe" && capturedData && (
                <div className="flex-1 flex flex-col items-center justify-start pt-24 px-6 pb-6 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="w-full max-w-md space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Describe Your Moment
                            </h2>
                            <p className="mt-2 text-sm text-white/50">
                                Add context to your verified capture before
                                archiving it permanently.
                            </p>
                        </div>

                        {/* Thumbnail preview */}
                        {imageUrl && (
                            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 relative">
                                <Image
                                    src={imageUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Coastal Cleanup Morning"
                                maxLength={100}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                            />
                            <p className="mt-1 text-right text-[10px] text-white/30">
                                {title.length}/100
                            </p>
                        </div>

                        {/* Caption */}
                        <div>
                            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                Caption
                            </label>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="What's happening in this moment?"
                                maxLength={500}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none"
                            />
                            <p className="mt-1 text-right text-[10px] text-white/30">
                                {caption.length}/500
                            </p>
                        </div>

                        {/* Pillar selector */}
                        <div>
                            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                Category *
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
                                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                                                isSelected
                                                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30"
                                                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70",
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
                            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
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
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                                />
                                {isGeocodingLocation && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setStep("preview")}
                                className="flex-1 py-4 bg-white/5 text-white/70 font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                            >
                                BACK
                            </button>
                            <button
                                onClick={handleArchive}
                                disabled={!canArchive}
                                className="flex-2 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <UploadCloud className="w-5 h-5" />
                                ARCHIVE MOMENT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step: Archiving (Progress) ───────────── */}
            {step === "archiving" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-white">
                            Archiving...
                        </h2>
                        <p className="text-sm text-white/50">
                            {archiveProgress}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Step: Done (Success) ─────────────────── */}
            {step === "done" && archiveResult && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 mb-4">
                        <Check className="w-12 h-12 text-green-400" />
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-white">
                            Moment Archived
                        </h2>
                        <p className="text-white/50 text-sm max-w-xs mx-auto">
                            Your verified human moment is now permanently stored
                            on the decentralized web.
                        </p>
                    </div>

                    <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">
                                    IPFS CID
                                </span>
                                <a
                                    href={archiveResult.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-mono text-cyan-400 hover:underline truncate max-w-45"
                                >
                                    {archiveResult.imageHash}
                                </a>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">
                                    Proof Link
                                </span>
                                <a
                                    href={archiveResult.proofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-mono text-cyan-400 hover:underline truncate max-w-45"
                                >
                                    view_proof.json
                                </a>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">
                                    Status
                                </span>
                                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                                    Permanent
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full max-w-md">
                        <button
                            onClick={handleReset}
                            className="flex-1 py-4 bg-white/5 text-white/70 font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                        >
                            CAPTURE ANOTHER
                        </button>
                        <button
                            onClick={() => router.push("/feed")}
                            className="flex-2 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                        >
                            VIEW IN FEED
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
