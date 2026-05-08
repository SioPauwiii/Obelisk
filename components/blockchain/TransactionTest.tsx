"use client";

import { useState } from "react";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2, CheckCircle2, XCircle, ExternalLink, ShieldCheck, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransactionTest() {
  const { authenticated, login } = usePrivy();
  const { smartAccountClient, smartAccountAddress } = useSmartAccount();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTestTransaction = async () => {
    if (!smartAccountClient) return;

    try {
      setStatus("pending");
      setErrorMessage(null);
      setTxHash(null);

      // Sending a self-transfer of 0 ETH (gasless sponsored by Pimlico)
      // This verifies that the bundler and paymaster are correctly configured
      const hash = await smartAccountClient.sendTransaction({
        to: smartAccountAddress as `0x${string}`,
        value: BigInt(0),
        data: "0x",
      });

      setTxHash(hash);
      setStatus("success");
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setStatus("error");
      setErrorMessage(error.message || "An unknown error occurred");
    }
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-700 rounded-2xl bg-zinc-900/50 backdrop-blur-sm">
        <ShieldCheck className="w-12 h-12 text-zinc-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
        <p className="text-zinc-400 text-center mb-6 max-w-xs">
          Please log in to initialize your Smart Account and test blockchain connectivity.
        </p>
        <button
          onClick={() => login()}
          className="px-6 py-2.5 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition-colors"
        >
          Login with Privy
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Status Card */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck className="w-24 h-24 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Blockchain Connectivity Test
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Smart Account Address</span>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-black/50 p-2 rounded-lg border border-zinc-800 text-emerald-400 font-mono break-all w-full">
                {smartAccountAddress || "Initializing..."}
              </code>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Network</span>
            <span className="text-sm text-zinc-300 font-medium">Avalanche Fuji Testnet</span>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={handleTestTransaction}
              disabled={status === "pending" || !smartAccountClient}
              className={cn(
                "group relative w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold transition-all duration-300",
                status === "pending" 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              )}
            >
              {status === "pending" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Gasless Transaction...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  Send Sponsored Test Transaction
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-500 text-center italic">
              * This transaction is fully sponsored by the Pimlico Paymaster. No AVAX required.
            </p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {status !== "idle" && (
        <div className={cn(
          "p-6 rounded-2xl border transition-all duration-500 animate-in fade-in slide-in-from-bottom-4",
          status === "success" ? "bg-emerald-950/20 border-emerald-500/30" : 
          status === "error" ? "bg-red-950/20 border-red-500/30" : 
          "bg-zinc-900/50 border-zinc-800"
        )}>
          {status === "pending" && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold">Broadcasting User Operation</h4>
                <p className="text-sm text-zinc-400">Communicating with Pimlico Bundler...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <div>
                  <h4 className="text-white font-semibold">Transaction Successful!</h4>
                  <p className="text-sm text-zinc-400">The gasless transaction was confirmed on-chain.</p>
                </div>
              </div>
              
              {txHash && (
                <div className="mt-4 p-4 bg-black/40 rounded-xl border border-emerald-500/20">
                  <span className="text-xs text-zinc-500 block mb-2 uppercase font-bold tracking-tighter">Transaction Hash</span>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-xs text-emerald-400 font-mono truncate">{txHash}</code>
                    <a
                      href={`https://testnet.snowtrace.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 font-bold transition-colors whitespace-nowrap"
                    >
                      View on Snowtrace <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <XCircle className="w-10 h-10 text-red-500" />
                <div>
                  <h4 className="text-white font-semibold">Transaction Failed</h4>
                  <p className="text-sm text-zinc-400">Something went wrong during execution.</p>
                </div>
              </div>
              <div className="mt-2 p-4 bg-red-950/30 rounded-xl border border-red-500/20">
                <p className="text-xs text-red-400 font-mono break-words">
                  {errorMessage}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                Tip: Check if the Pimlico API key is valid and has remaining credit on the Fuji testnet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
