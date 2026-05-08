"use client";

import { useState } from "react";
import { useLoginWithEmail } from "@privy-io/react-auth";

export function LoginWithEmail() {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [stage, setStage] = useState<"email" | "code">("email");
    const [error, setError] = useState<string | null>(null);

    const { sendCode, loginWithCode } = useLoginWithEmail();

    const onSendCode = async () => {
        setError(null);
        try {
            await sendCode({ email });
            setStage("code");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not send code",
            );
        }
    };

    const onLogin = async () => {
        setError(null);
        try {
            await loginWithCode({ code });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid code");
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div className="space-y-1.5">
                <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={stage === "code"}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 dark:disabled:bg-slate-950"
                />
            </div>

            {stage === "code" ? (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label
                        htmlFor="code"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        Verification Code
                    </label>
                    <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={code}
                        onChange={(e) => {
                            const value = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);
                            setCode(value);
                        }}
                        placeholder="123456"
                        className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm tracking-widest text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 placeholder:tracking-normal focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500"
                    />
                </div>
            ) : null}

            {error ? (
                <p className="text-sm font-medium text-red-500 dark:text-red-400">
                    {error}
                </p>
            ) : null}

            <div className="pt-2">
                {stage === "email" ? (
                    <button
                        type="button"
                        onClick={onSendCode}
                        disabled={!email}
                        className="w-full rounded-lg bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
                    >
                        Send Code
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onLogin}
                        disabled={!code}
                        className="w-full rounded-lg bg-linear-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-indigo-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-950"
                    >
                        Verify & Login
                    </button>
                )}
            </div>
        </div>
    );
}
