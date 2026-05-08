"use client";

import React, { useEffect, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { hashBlob, generateProofOfCapture } from "@/lib/utils/crypto";
import {
    Camera as CameraIcon,
    RotateCw,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    className?: string;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, className }) => {
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
        captureLimit,
        capturesUsed,
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
        autoStartIfPermitted();
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
                "relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center",
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

                    {/* Scanline Animation */}
                    <div className="absolute inset-0 z-20 pointer-events-none bg-linear-to-b from-transparent via-cyan-500/10 to-transparent h-1/4 w-full animate-scan" />

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
                            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-300",
                                        livenessCheck
                                            ? "bg-cyan-500"
                                            : "bg-yellow-500",
                                    )}
                                    style={{
                                        width: `${Math.min(livenessScore * 10, 100)}%`,
                                    }}
                                />
                            </div>

                            {captureLimitReached && (
                                <div className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-400/30 text-red-200 text-xs font-medium text-center">
                                    Capture limit reached for now.
                                    {nextCaptureResetAt
                                        ? ` Try again after ${new Date(nextCaptureResetAt).toLocaleString()}.`
                                        : " Try again later."}
                                </div>
                            )}

                            <div className="flex items-center gap-12">
                                <button
                                    onClick={stopCamera}
                                    type="button"
                                    aria-label="Stop camera"
                                    className="p-3 rounded-full bg-white/6 border border-white/8 hover:bg-white/8 transition-colors"
                                >
                                    <RotateCw className="w-6 h-6 text-white/70" />
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
                                                {status === "verifying" ||
                                                starting ? (
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
                                <div className="w-14" /> {/* Spacer */}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 px-8 text-center max-w-lg">
                    <div className="w-20 h-20 rounded-full bg-linear-to-br from-cyan-700/20 to-cyan-400/10 flex items-center justify-center border border-white/6">
                        <CameraIcon className="w-10 h-10 text-cyan-300" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-white">
                            Live Capture
                        </h2>
                        <p className="text-sm text-white/60 leading-relaxed">
                            We take a live photo and seal it cryptographically.
                            Allow camera and motion sensors to continue.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-400/8 px-4 py-2 rounded-lg border border-red-400/20">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs">{error}</span>
                        </div>
                    )}

                    {/* Permission specific actions */}
                    {permissionState === "denied" ? (
                        <div className="space-y-3">
                            <p className="text-sm text-white/50">
                                Camera access is blocked. To enable, open your
                                browser site settings and allow Camera
                                permission.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(
                                                window.location.href,
                                            );
                                        } catch {}
                                    }}
                                    className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/8 transition-colors"
                                >
                                    Copy site URL
                                </button>
                                <button
                                    onClick={handleStart}
                                    type="button"
                                    className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors"
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
                                className="w-full py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-[0_8px_30px_rgba(6,182,212,0.24)]"
                            >
                                {starting
                                    ? "Starting camera…"
                                    : "Enable Camera"}
                            </button>
                            <p className="text-xs text-white/40 mt-3">
                                Daily limit: {captureLimit} verified captures
                                per 24 hours. Used: {capturesUsed}.
                            </p>
                        </div>
                    )}
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
