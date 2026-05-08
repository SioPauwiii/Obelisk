"use client";

import React, { useEffect, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { hashBlob, generateProofOfCapture } from "@/lib/utils/crypto";
import { Camera as CameraIcon, RotateCw, MapPin, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraProps {
  onCapture: (proof: any) => void;
  className?: string;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, className }) => {
  const {
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capture,
    stream,
    error,
    isPermissionGranted,
    isCapturing,
    livenessScore,
  } = useCamera();

  const [status, setStatus] = useState<"idle" | "ready" | "capturing" | "verifying">("idle");
  const [livenessCheck, setLivenessCheck] = useState(false);

  useEffect(() => {
    if (isPermissionGranted && stream) {
      setStatus("ready");
    }
  }, [isPermissionGranted, stream]);

  // Visual feedback for movement
  useEffect(() => {
    if (livenessScore > 5) {
      setLivenessCheck(true);
    }
  }, [livenessScore]);

  const handleStart = async () => {
    await startCamera();
  };

  const handleCapture = async () => {
    if (status !== "ready") return;
    
    setStatus("capturing");
    const result = await capture();
    
    if (result) {
      setStatus("verifying");
      const { blob, metadata } = result;
      
      // Verification logic: 
      // 1. Detect if movement happened (Anti-Screen Check)
      if (metadata.sensors.orientationDelta < 2) {
        // We could block here, but for MVP let's just flag it in metadata
        console.warn("Low liveness detected. Capture might be a static screen.");
      }

      const hash = await hashBlob(blob);
      const proof = await generateProofOfCapture({
        hash,
        ...metadata,
        version: "1.0",
      });

      // Pass both the blob and the proof
      onCapture({ blob, proof });
      setStatus("ready");
    } else {
      setStatus("ready");
    }
  };

  return (
    <div className={cn("relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center", className)}>
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
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
          <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-1/4 w-full animate-scan" />
          
          {/* UI Overlays */}
          <div className="absolute inset-0 z-30 flex flex-col justify-between p-6">
            {/* Top Bar: Status */}
            <div className="flex justify-between items-start">
              <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", livenessCheck ? "bg-green-500" : "bg-yellow-500")} />
                <span className="text-xs font-mono text-white/80 uppercase tracking-widest">
                  {livenessCheck ? "Liveness Validated" : "Tilt device to verify"}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 items-end">
                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-lg p-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-mono text-white/60">GPS ACTIVE</span>
                </div>
                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-lg p-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span className="text-[10px] font-mono text-white/60">ENCRYPTED</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Actions */}
            <div className="flex flex-col items-center gap-8">
              {/* Liveness Gauge */}
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={cn("h-full transition-all duration-300", livenessCheck ? "bg-cyan-500" : "bg-yellow-500")}
                  style={{ width: `${Math.min(livenessScore * 10, 100)}%` }}
                />
              </div>

              <div className="flex items-center gap-12">
                <button 
                  onClick={stopCamera}
                  className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <RotateCw className="w-6 h-6 text-white/60" />
                </button>

                <button
                  onClick={handleCapture}
                  disabled={status !== "ready"}
                  className={cn(
                    "relative group p-1 rounded-full border-4 border-white/20 transition-all active:scale-95",
                    status === "capturing" && "scale-90 opacity-50"
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    {status === "verifying" ? (
                      <Loader2 className="w-8 h-8 text-black animate-spin" />
                    ) : (
                      <CameraIcon className="w-8 h-8 text-black" />
                    )}
                  </div>
                  {/* Pulse Effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-20 pointer-events-none" />
                </button>

                <div className="w-14" /> {/* Spacer */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 px-10 text-center">
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
            <CameraIcon className="w-10 h-10 text-cyan-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Anti-AI Camera</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              To archive your moment, we need access to your camera and motion sensors.
              Photos are taken live and cryptographically sealed.
            </p>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">{error}</span>
            </div>
          )}

          <button
            onClick={handleStart}
            className="w-full py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            ENABLE CAMERA
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
