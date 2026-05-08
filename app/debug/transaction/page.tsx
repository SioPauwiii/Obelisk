import dynamic from "next/dynamic";

const TransactionTest = dynamic(
  () => import("@/components/blockchain/TransactionTest").then(mod => mod.TransactionTest),
  { ssr: false }
);

export default function TransactionDebugPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <div className="container mx-auto px-4 py-20 flex flex-col items-center">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest">
            System Diagnostics
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            Transaction Integrity Test
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Use this utility to verify the gasless transaction pipeline. It will attempt to send a sponsored 
            user operation through the Pimlico bundler to the Avalanche Fuji testnet.
          </p>
        </div>

        <TransactionTest />

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Smart Account
            </h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Uses Permissionless.js to derive a Safe V1.4.1 Smart Account from your Privy EOA.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Gas Sponsorship
            </h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              The transaction is sponsored by Pimlico Paymaster. The user doesn't need native AVAX.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Network
            </h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Targeting Avalanche Fuji C-Chain (Chain ID: 43113) for high-speed testnet verification.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
