"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
    images: string[];
    initialIndex?: number;
    onClose?: () => void;
}

export default function Lightbox({
    images,
    initialIndex = 0,
    onClose,
}: LightboxProps) {
    const [index, setIndex] = useState(initialIndex);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose?.();
            if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
            if (e.key === "ArrowRight")
                setIndex((i) => Math.min(images.length - 1, i + 1));
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [images.length, onClose]);

    if (!images || images.length === 0) return null;
    if (!mounted) return null;

    const content = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="relative max-w-5xl w-full max-h-[90vh] mx-auto">
                <button
                    onClick={() => onClose?.()}
                    aria-label="Close"
                    className="absolute top-3 right-3 z-50 rounded-full bg-black/50 p-2 text-white"
                >
                    <X className="w-4 h-4" />
                </button>

                {index > 0 && (
                    <button
                        onClick={() => setIndex((i) => Math.max(0, i - 1))}
                        aria-label="Previous"
                        className="absolute left-3 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                {index < images.length - 1 && (
                    <button
                        onClick={() =>
                            setIndex((i) => Math.min(images.length - 1, i + 1))
                        }
                        aria-label="Next"
                        className="absolute right-3 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}

                <div className="relative w-full h-[70vh] bg-black flex items-center justify-center rounded-lg overflow-hidden">
                    <Image
                        src={images[index]}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-contain"
                        unoptimized
                    />

                    <div className="absolute bottom-3 right-3 z-50 rounded px-2 py-1 bg-black/50 text-white text-sm">
                        {index + 1} / {images.length}
                    </div>
                </div>

                {images.length > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                        {images.map((src, i) => (
                            <button
                                key={src + i}
                                onClick={() => setIndex(i)}
                                className={`relative h-16 w-16 rounded-md overflow-hidden border ${
                                    i === index
                                        ? "ring-2 ring-cyan-400"
                                        : "opacity-80"
                                }`}
                            >
                                <Image
                                    src={src}
                                    alt={`thumb-${i}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
