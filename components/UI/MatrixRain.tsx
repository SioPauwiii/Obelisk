"use client";
import { useEffect, useState, useRef } from "react";

export const MatrixRain = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [frame, setFrame] = useState("");
    const timerRef = useRef<number>(0);
    const dimensions = useRef({ cols: 0, rows: 0 });

    useEffect(() => {
        const chars = " .:-=+*#%@";
        const charWidth = 8; // Approximate width of a monospace char in px
        const charHeight = 14; // Approximate height of a monospace char in px

        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } =
                    containerRef.current.getBoundingClientRect();
                dimensions.current = {
                    cols: Math.floor(width / charWidth),
                    rows: Math.floor(height / charHeight),
                };
            }
        };

        // Initial sizing
        updateDimensions();
        window.addEventListener("resize", updateDimensions);

        const animate = (time: number) => {
            const { cols, rows } = dimensions.current;
            if (cols === 0 || rows === 0) return;

            let output = "";
            const t = time * 0.001; // Speed control

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    // A "DNA-like" or "Data Stream" pattern
                    // We use sine waves that interact based on X and Y
                    const wave1 = Math.sin(x * 0.1 + t);
                    const wave2 = Math.cos(y * 0.2 + t * 0.5);
                    const wave3 = Math.sin((x + y) * 0.05 + t);

                    const combined = (wave1 + wave2 + wave3) / 3;

                    // Map to character index
                    const charIndex = Math.floor(
                        ((combined + 1) / 2) * (chars.length - 1),
                    );
                    output += chars[charIndex] || " ";
                }
                output += "\n";
            }

            setFrame(output);
            timerRef.current = requestAnimationFrame(animate);
        };

        timerRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(timerRef.current);
            window.removeEventListener("resize", updateDimensions);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
        >
            <pre className="pointer-events-none select-none text-[12px] leading-3.5 font-mono text-cyan-500/20 whitespace-pre">
                {frame}
            </pre>
        </div>
    );
};
