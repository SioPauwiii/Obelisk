"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const CAPTURE_LIMIT = 100;
const CAPTURE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CAPTURE_HISTORY_KEY = "obelisk-camera-capture-history-v1";

function getValidCaptureHistory(now: number): number[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(CAPTURE_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((ts): ts is number => typeof ts === "number")
            .filter((ts) => now - ts < CAPTURE_WINDOW_MS)
            .sort((a, b) => a - b);
    } catch {
        return [];
    }
}

function saveCaptureHistory(history: number[]) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(
            CAPTURE_HISTORY_KEY,
            JSON.stringify(history),
        );
    } catch {
        // Ignore storage write issues (private browsing, quota, etc.)
    }
}

export interface CaptureMetadata {
    timestamp: number;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number;
    } | null;
    sensors: {
        orientationDelta: number;
        isMobile: boolean;
    };
}

export const useCamera = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [livenessScore, setLivenessScore] = useState(0);
    const [captureCount, setCaptureCount] = useState(() => {
        const now = Date.now();
        const history = getValidCaptureHistory(now);
        saveCaptureHistory(history);
        return history.length;
    });
    const [nextResetAt, setNextResetAt] = useState<number | null>(() => {
        const now = Date.now();
        const history = getValidCaptureHistory(now);
        saveCaptureHistory(history);
        return history.length > 0 ? history[0] + CAPTURE_WINDOW_MS : null;
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Track sensor data for liveness
    const initialOrientation = useRef<{
        alpha: number;
        beta: number;
        gamma: number;
    } | null>(null);
    const maxDelta = useRef<number>(0);

    const handleOrientation = (event: DeviceOrientationEvent) => {
        if (!initialOrientation.current) {
            initialOrientation.current = {
                alpha: event.alpha || 0,
                beta: event.beta || 0,
                gamma: event.gamma || 0,
            };
            return;
        }

        const delta =
            Math.abs((event.alpha || 0) - initialOrientation.current.alpha) +
            Math.abs((event.beta || 0) - initialOrientation.current.beta) +
            Math.abs((event.gamma || 0) - initialOrientation.current.gamma);

        if (delta > maxDelta.current) {
            maxDelta.current = delta;
            setLivenessScore(maxDelta.current);
        }
    };

    const markCaptureConsumed = useCallback(() => {
        const now = Date.now();
        const history = getValidCaptureHistory(now);
        const updated = [...history, now];
        saveCaptureHistory(updated);
        setCaptureCount(updated.length);
        setNextResetAt(updated[0] + CAPTURE_WINDOW_MS);
    }, []);

    const canCapture = captureCount < CAPTURE_LIMIT;

    const startCamera = useCallback(async () => {
        if (stream) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Your browser does not support camera access.");
            return;
        }

        try {
            // First attempt: Try to get the back camera (ideal for mobile)
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            };

            let mediaStream: MediaStream;
            try {
                mediaStream =
                    await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.warn(
                    "Preferred camera constraints failed, falling back to basic video.",
                    err,
                );
                // Second attempt: Just get any video device (covers laptops/desktops)
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            }

            setStream(mediaStream);
            setIsPermissionGranted(true);
            setError(null);

            // Request Motion permissions for iOS
            if (
                typeof DeviceOrientationEvent !== "undefined" &&
                typeof (DeviceOrientationEvent as any).requestPermission ===
                    "function"
            ) {
                try {
                    const permission = await (
                        DeviceOrientationEvent as any
                    ).requestPermission();
                    if (permission !== "granted") {
                        console.warn("Motion permission denied");
                    }
                } catch (e) {
                    console.error("Error requesting motion permission", e);
                }
            }

            window.addEventListener("deviceorientation", handleOrientation);
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            if (err.name === "NotAllowedError") {
                setError(
                    "Camera permission denied. Please allow access in your browser settings.",
                );
            } else {
                setError("Camera not available or another app is using it.");
            }
        }
    }, [stream]);

    const autoStartIfPermitted = useCallback(async () => {
        if (stream) return;
        if (typeof navigator === "undefined") return;
        if (!navigator.permissions?.query) return;

        try {
            const status = await navigator.permissions.query({
                name: "camera" as PermissionName,
            });
            if (status.state === "granted") {
                await startCamera();
            }
        } catch {
            // Some browsers do not support camera permission query reliably.
        }
    }, [startCamera, stream]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        window.removeEventListener("deviceorientation", handleOrientation);
    }, [stream]);

    const getGeolocation = (): Promise<GeolocationPosition | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 5000 },
            );
        });
    };

    const capture = useCallback(async (): Promise<{
        blob: Blob;
        metadata: CaptureMetadata;
    } | null> => {
        if (!videoRef.current || !canvasRef.current || !stream) return null;
        if (!canCapture) {
            setError(
                "Capture limit reached. You can take up to 5 photos per 24 hours.",
            );
            return null;
        }

        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Match canvas size to video aspect ratio
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        // Draw the current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get geolocation
        const locationData = await getGeolocation();

        const metadata: CaptureMetadata = {
            timestamp: Date.now(),
            location: locationData
                ? {
                      latitude: locationData.coords.latitude,
                      longitude: locationData.coords.longitude,
                      accuracy: locationData.coords.accuracy,
                  }
                : null,
            sensors: {
                orientationDelta: maxDelta.current,
                isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
            },
        };

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    setIsCapturing(false);
                    if (blob) {
                        markCaptureConsumed();
                        resolve({ blob, metadata });
                    } else {
                        resolve(null);
                    }
                },
                "image/jpeg",
                0.9,
            );
        });
    }, [stream, canCapture, markCaptureConsumed]);

    // Sync stream to video element
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isPermissionGranted]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return {
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
        captureLimit: CAPTURE_LIMIT,
        capturesUsed: captureCount,
        capturesRemaining: Math.max(0, CAPTURE_LIMIT - captureCount),
        captureLimitReached: !canCapture,
        nextCaptureResetAt: nextResetAt,
    };
};
