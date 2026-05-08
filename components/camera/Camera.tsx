"use client";

import React, { useEffect, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { hashBlob, generateProofOfCapture } from "@/lib/utils/crypto";
import {
    Camera as CameraIcon,
    RotateCw,
    AlertCircle,
    Loader2,
    ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CameraProps {
    // Proof shape expected by the app
    onCapture: (data: {
        blob: Blob;
        proof: {
            payload: {
                location?: { latitude?: number; longitude?: number } | null;
                sensors: { orientationDelta: number };
                hash?: string;
                timestamp?: number;
                [k: string]: unknown;
            };
            [k: string]: unknown;
        };
    }) => void;
    capturedImageUrl?: string | null;
    onOpenArchive?: () => void;
    onRetake?: () => void;
    className?: string;
}

export const Camera: React.FC<CameraProps> = ({
    onCapture,
    capturedImageUrl,
    onOpenArchive,
    onRetake,
    className,
}) => {
    const {
        videoRef,
        canvasRef,
        startCamera,
        autoStartIfPermitted,
        stopCamera,
        capture,
        stream,
        error,
        isPermissionGranted,
        isCapturing,
        livenessScore,
        captureLimitReached,
        nextCaptureResetAt,
    } = useCamera();

    const [status, setStatus] = useState<
        "idle" | "ready" | "capturing" | "verifying"
    >("idle");
    const livenessCheck = livenessScore > 5;
    const [permissionState, setPermissionState] = useState<
        "unknown" | "granted" | "denied" | "prompt"
    >("unknown");
    const [starting, setStarting] = useState(false);
    const [bootstrappingCamera, setBootstrappingCamera] = useState(true);

    useEffect(() => {
        if (isPermissionGranted && stream) {
            // defer status update to avoid synchronous setState in effect
            const t = setTimeout(() => {
                setStatus((prev) => (prev === "idle" ? "ready" : prev));
            }, 50);
            return () => clearTimeout(t);
        }
    }, [isPermissionGranted, stream]);

    useEffect(() => {
        let active = true;
        void autoStartIfPermitted().finally(() => {
            if (!active) return;
            setBootstrappingCamera(false);
        });
        return () => {
            active = false;
        };
    }, [autoStartIfPermitted]);

    // Query camera permission state to provide helpful UX (denied vs prompt)
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (
                typeof navigator === "undefined" ||
                !navigator.permissions?.query
            ) {
                if (!mounted) return;
                setPermissionState(
                    isPermissionGranted
                        ? "granted"
                        : error
                          ? "denied"
                          : "prompt",
                );
                return;
            }
            try {
                const status = await navigator.permissions.query({
                    name: "camera" as PermissionName,
                });
                if (!mounted) return;
                setPermissionState(
                    status.state === "granted"
                        ? "granted"
                        : status.state === "denied"
                          ? "denied"
                          : "prompt",
                );
                const onChange = () => {
                    if (!mounted) return;
                    setPermissionState(
                        status.state === "granted"
                            ? "granted"
                            : status.state === "denied"
                              ? "denied"
                              : "prompt",
                    );
                };
                status.addEventListener?.("change", onChange);
                return () => status.removeEventListener?.("change", onChange);
            } catch {
                if (!mounted) return;
                setPermissionState(
                    isPermissionGranted
                        ? "granted"
                        : error
                          ? "denied"
                          : "prompt",
                );
            }
        })();
        return () => {
            mounted = false;
        };
    }, [isPermissionGranted, error]);

    // livenessCheck derived from livenessScore

    const handleStart = async () => {
        try {
            setStarting(true);
            await startCamera();
        } finally {
            setStarting(false);
        }
    };

    const handleCapture = async () => {
        if (
            !isPermissionGranted ||
            !stream ||
            captureLimitReached ||
            isCapturing ||
            starting
        ) {
            return;
        }

        setStatus("capturing");
        try {
            const result = await capture();
            if (result) {
                setStatus("verifying");
                const { blob, metadata } = result;
                if (metadata.sensors.orientationDelta < 2) {
                    console.warn(
                        "Low liveness detected. Capture might be a static screen.",
                    );
                }
                const hash = await hashBlob(blob);
                const proof = await generateProofOfCapture({
                    hash,
                    ...metadata,
                    version: "1.0",
                });
                onCapture({ blob, proof });
            }
        } finally {
            setStatus("ready");
        }
    };

    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden flex flex-col items-center justify-center bg-linear-to-b from-slate-50 to-slate-100",
                className,
            )}
        >
            {/* Background Grid Overlay */}
            {/* <div
                className="absolute inset-0 z-10 pointer-events-none opacity-20"
                style={{
                    backgroundImage:
                        "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            /> */}

            {/* Camera Feed */}
            {isPermissionGranted ? (
                <div className="relative w-full h-full flex items-center justify-center">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* UI Overlays */}
                    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6">
                        {/* Top Bar: Status */}
                        <div className="flex justify-between items-start">
                            {/* <div className="flex flex-col gap-2 items-end">
                                <div
                                    className={cn(
                                        "backdrop-blur-md border rounded-lg p-2 flex items-center gap-2",
                                        captureLimitReached
                                            ? "bg-red-500/10 border-red-500/30"
                                            : "bg-black/50 border-white/10",
                                    )}
                                >
                                    <CameraIcon
                                        className={cn(
                                            "w-4 h-4",
                                            captureLimitReached
                                                ? "text-red-400"
                                                : "text-cyan-400",
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-[10px] font-mono",
                                            captureLimitReached
                                                ? "text-red-300"
                                                : "text-white/70",
                                        )}
                                    >
                                        {capturesRemaining}/{captureLimit} SHOTS
                                        LEFT
                                    </span>
                                </div>
                            </div> */}
                        </div>

                        {/* Bottom Bar: Actions */}
                        <div className="flex flex-col items-center gap-8">
                            {/* Liveness Gauge */}
                            <div className="w-48 h-1.5 rounded-full overflow-hidden border border-slate-300/90 bg-white/80 shadow-sm">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-300",
                                        livenessCheck
                                            ? "bg-cyan-500"
                                            : "bg-amber-500",
                                    )}
                                    style={{
                                        width: `${Math.min(livenessScore * 10, 100)}%`,
                                    }}
                                />
                            </div>

                            {captureLimitReached && (
                                <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center shadow-sm">
                                    Capture limit reached for now.
                                    {nextCaptureResetAt
                                        ? ` Try again after ${new Date(nextCaptureResetAt).toLocaleString()}.`
                                        : " Try again later."}
                                </div>
                            )}

                            <div className="flex items-center gap-8">
                                <button
                                    onClick={
                                        capturedImageUrl ? onRetake : stopCamera
                                    }
                                    type="button"
                                    aria-label={
                                        capturedImageUrl
                                            ? "Retake photo"
                                            : "Stop camera"
                                    }
                                    className="p-3 rounded-full bg-white/90 border border-slate-200 hover:bg-white transition-colors shadow-sm shrink-0"
                                >
                                    <RotateCw className="w-6 h-6 text-slate-600" />
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={handleCapture}
                                        type="button"
                                        disabled={
                                            !isPermissionGranted ||
                                            !stream ||
                                            captureLimitReached ||
                                            starting ||
                                            isCapturing
                                        }
                                        aria-label="Capture photo"
                                        className={cn(
                                            "relative flex items-center justify-center rounded-full transition-transform",
                                            status === "capturing" || starting
                                                ? "scale-95 opacity-60"
                                                : "scale-100",
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-20 h-20 rounded-full shadow-[0_10px_30px_rgba(6,182,212,0.24)] flex items-center justify-center",
                                                captureLimitReached
                                                    ? "bg-red-600/90"
                                                    : "bg-linear-to-br from-cyan-400 to-emerald-400",
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                                                {starting ? (
                                                    <Loader2 className="w-6 h-6 text-black animate-spin" />
                                                ) : (
                                                    <CameraIcon className="w-6 h-6 text-black" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Ready ring */}
                                    {!captureLimitReached &&
                                        status === "ready" && (
                                            <span className="pointer-events-none absolute -inset-2 rounded-full border-2 border-cyan-500 opacity-50 animate-pulse" />
                                        )}
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        capturedImageUrl
                                            ? onOpenArchive
                                            : undefined
                                    }
                                    disabled={!capturedImageUrl}
                                    aria-label="Open archive preview"
                                    className={cn(
                                        "relative overflow-hidden w-16 h-16 rounded-2xl border transition-transform shrink-0 shadow-sm",
                                        capturedImageUrl
                                            ? "border-emerald-300/70 bg-white/95 hover:scale-105"
                                            : "border-slate-200 bg-white/80 opacity-60 cursor-not-allowed",
                                    )}
                                >
                                    {capturedImageUrl ? (
                                        <>
                                            <Image
                                                src={capturedImageUrl}
                                                alt="Captured thumbnail"
                                                className="h-full w-full object-cover"
                                                width={64}
                                                height={64}
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-slate-900/25 via-transparent to-transparent" />
                                            <div className="absolute bottom-1.5 right-1.5 rounded-full bg-white/90 p-1">
                                                <ArrowUpRight className="w-3 h-3 text-black" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                            Gallery
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-cyan-100 to-sky-100 flex items-center justify-center border border-cyan-200/80">
                            {bootstrappingCamera ||
                            (permissionState === "granted" && !error) ? (
                                <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
                            ) : (
                                <CameraIcon className="w-10 h-10 text-cyan-600" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Live Capture
                            </h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {bootstrappingCamera ||
                                (permissionState === "granted" && !error)
                                    ? "Starting camera..."
                                    : "Take a live photo and seal it cryptographically. Allow camera and motion sensors to continue."}
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-200 w-full">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="text-xs text-left">
                                    {error}
                                </span>
                            </div>
                        )}

                        {/* Permission specific actions */}
                        {bootstrappingCamera ||
                        (permissionState === "granted" && !error) ? (
                            <div className="w-full">
                                <div className="w-full py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-semibold">
                                    Preparing camera...
                                </div>
                            </div>
                        ) : permissionState === "denied" ? (
                            <div className="space-y-3 w-full">
                                <p className="text-sm text-slate-600">
                                    Camera access is blocked. Open browser site
                                    settings and allow camera permission.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(
                                                    window.location.href,
                                                );
                                            } catch {}
                                        }}
                                        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                                    >
                                        Copy site URL
                                    </button>
                                    <button
                                        onClick={handleStart}
                                        type="button"
                                        className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">
                                <button
                                    onClick={handleStart}
                                    type="button"
                                    disabled={starting}
                                    className="w-full py-3 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-600 transition-all shadow-[0_8px_24px_rgba(6,182,212,0.25)]"
                                >
                                    {starting
                                        ? "Starting camera…"
                                        : "Enable Camera"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes scan {
                    0% {
                        transform: translateY(-100%);
                    }
                    100% {
                        transform: translateY(400%);
                    }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}</style>
        </div>
    );
};
