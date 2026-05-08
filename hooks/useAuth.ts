"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createBrowserClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface AppUser {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    wallet_address: string;
    auth_provider: string;
    is_verified_human: boolean;
    humanity_score: number;
    country: string | null;
    pillar_preference: string | null;
    voucher_count: number;
    created_at: string;
    updated_at: string;
}

export type LoginMethod = "google" | "apple" | "email";

export interface UseAuth {
    user: AppUser | null;
    walletAddress: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    authError: string | null;
    login: (method?: LoginMethod) => void;
    logout: () => Promise<void>;
    clearError: () => void;
}

// ─────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────

export function useAuth(): UseAuth {
    const {
        ready,
        authenticated,
        user: privyUser,
        login: privyLogin,
        logout: privyLogout,
        getAccessToken,
    } = usePrivy();

    const { wallets } = useWallets();

    const [user, setUser] = useState<AppUser | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const sessionCreatedRef = useRef(false);

    // ── Find the embedded wallet ─────────────────────
    const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
    );


    // ── Stable ref to getAccessToken (avoids useCallback dep churn) ─
    const getAccessTokenRef = useRef(getAccessToken);
    getAccessTokenRef.current = getAccessToken;

    // ── Create Supabase session after Privy auth ─────
    // Note: createSession is NOT in the useEffect deps below.
    // Using a ref avoids re-creating the callback (and re-firing the effect)
    // every time Privy internally recreates getAccessToken.
    const createSession = useCallback(async (walletAddr: string) => {
        if (sessionCreatedRef.current) return;

        setIsLoading(true);
        setAuthError(null);

        try {
            sessionCreatedRef.current = true;
            const accessToken = await getAccessTokenRef.current();
            if (!accessToken) {
                setAuthError("Unable to retrieve a valid login token.");
                sessionCreatedRef.current = false;
                return;
            }

            const res = await fetch("/api/auth/wallet-session", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    walletAddress: walletAddr,
                }),
            });

            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                console.error("Failed to create wallet session");
                setAuthError(
                    payload?.error ?? "Unable to finish sign-in. Please try again."
                );
                sessionCreatedRef.current = false;
                return;
            }

            const data = payload as { user?: AppUser; walletAddress: string };
            setWalletAddress(data.walletAddress);

            if (data.user) {
                setUser(data.user as AppUser);
            }
        } catch (error) {
            console.error("Session creation error:", error);
            setAuthError("Unable to finish sign-in. Please try again.");
            sessionCreatedRef.current = false;
        } finally {
            setIsLoading(false);
        }
    }, []); // stable — intentionally empty deps

    // ── Effect: handle auth state changes ────────────
    // createSession is intentionally omitted from deps — it's stable (empty deps)
    // and including it would cause the effect to re-fire on every Privy render.
    useEffect(() => {
        if (!ready) return;

        if (!authenticated) {
            setUser(null);
            setWalletAddress(null);
            setAuthError(null);
            setIsLoading(false);
            sessionCreatedRef.current = false;
            return;
        }

        if (embeddedWallet?.address) {
            setWalletAddress(embeddedWallet.address.toLowerCase());
            createSession(embeddedWallet.address);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, authenticated, embeddedWallet?.address]);

    // ── Login ────────────────────────────────────────
    const login = useCallback(
        (method?: LoginMethod) => {
            setAuthError(null);
            if (method) {
                privyLogin({ loginMethods: [method] });
                return;
            }
            privyLogin();
        },
        [privyLogin]
    );

    // ── Logout ───────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            // Clear Supabase session cookie
            await fetch("/api/auth/logout", { method: "POST" });

            // Clear Privy session
            await privyLogout();

            // Reset local state
            setUser(null);
            setWalletAddress(null);
            sessionCreatedRef.current = false;
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [privyLogout]);

    const clearError = useCallback(() => {
        setAuthError(null);
    }, []);

    return {
        user,
        walletAddress,
        isLoading: !ready || isLoading,
        isAuthenticated: authenticated && !!user,
        authError,
        login,
        logout,
        clearError,
    };
}
