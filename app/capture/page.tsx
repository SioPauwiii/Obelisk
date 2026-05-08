"use client";

import React, { useState } from "react";
import { Camera } from "@/components/camera/Camera";
import { ShieldCheck, ArrowLeft, UploadCloud, MapPin, Clock, Hash } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CapturePage() {
  const [capturedData, setCapturedData] = useState<{ blob: Blob; proof: any } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState<{ imageHash: string; proofHash: string; imageUrl: string; proofUrl: string } | null>(null);

  const handleCapture = ({ blob, proof }: { blob: Blob; proof: any }) => {
    setCapturedData({ blob, proof });
    setImageUrl(URL.createObjectURL(blob));
  };

  const handleReset = () => {
    setCapturedData(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setArchiveResult(null);
  };

  const handleArchive = async () => {
    if (!capturedData) return;
    
    setIsArchiving(true);
    try {
      const { archiveMoment } = await import("@/lib/utils/storage");
      const result = await archiveMoment(capturedData.blob, capturedData.proof);
      setArchiveResult(result);
    } catch (error) {
      console.error("Archival failed:", error);
      alert("Failed to archive. Make sure LIGHTHOUSE_API_KEY is set.");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
        <Link 
          href="/" 
          className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 pointer-events-auto hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/20">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase">Humanity Archive v1.0</span>
        </div>
      </div>

      {!capturedData ? (
        <Camera onCapture={handleCapture} />
      ) : archiveResult ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 mb-4">
            <ShieldCheck className="w-12 h-12 text-green-400" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Moment Archived</h2>
            <p className="text-white/50 text-sm max-w-xs mx-auto">
              Your verified human moment is now permanently stored on the decentralized web.
            </p>
          </div>

          <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Filecoin CID</span>
                <a 
                  href={archiveResult.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-cyan-400 hover:underline truncate max-w-[180px]"
                >
                  {archiveResult.imageHash}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Proof Link</span>
                <a 
                  href={archiveResult.proofUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-cyan-400 hover:underline truncate max-w-[180px]"
                >
                  view_proof.json
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Status</span>
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Permanent</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full max-w-md py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all"
          >
            CAPTURE ANOTHER
          </button>
        </div>
      ) : (
        <div className={cn("flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in duration-500", isArchiving && "opacity-50 pointer-events-none")}>
          <div className="relative group max-w-md w-full aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            {imageUrl && (
              <img src={imageUrl} alt="Captured" className="w-full h-full object-cover" />
            )}
            
            {/* Metadata Overlay on Preview */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-mono text-white/70">
                    {capturedData.proof.payload.location?.latitude.toFixed(4)}, {capturedData.proof.payload.location?.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-mono text-white/70">
                    {new Date(capturedData.proof.payload.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30">
              <ShieldCheck className="w-3 h-3 text-green-400" />
              <span className="text-[9px] font-mono font-bold text-green-400 uppercase tracking-tight">Verified Live</span>
            </div>
          </div>

          <div className="w-full max-w-md space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white/90">Proof of Capture</h3>
                <Hash className="w-4 h-4 text-white/30" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Image Hash</span>
                  <span className="text-[10px] font-mono text-white/60 truncate max-w-[150px]">
                    {capturedData.proof.payload.hash}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Signature</span>
                  <span className="text-[10px] font-mono text-cyan-400 truncate max-w-[150px]">
                    {capturedData.proof.signature}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Liveness Delta</span>
                  <span className="text-[10px] font-mono text-green-400">
                    {capturedData.proof.payload.sensors.orientationDelta.toFixed(2)} (PASS)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReset}
                disabled={isArchiving}
                className="flex-1 py-4 bg-white/5 text-white/70 font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
              >
                RETAKE
              </button>
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="flex-[2] py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
              >
                {isArchiving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    SEALING...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    ARCHIVE MOMENT
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
