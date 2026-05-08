"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePrivy, useWallets, getIdentityToken } from "@privy-io/react-auth";
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

export interface UseAuth {
    user: AppUser | null;
    walletAddress: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => Promise<void>;
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
    const sessionCreatedRef = useRef(false);

    // ── Find the embedded wallet ─────────────────────
    const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
    );

    // ── Create Supabase session after Privy auth ─────
    const createSession = useCallback(async () => {
        if (!authenticated || !embeddedWallet?.address || sessionCreatedRef.current) {
            return;
        }

        try {
            sessionCreatedRef.current = true;
            const accessToken = await getAccessToken();
            const identityToken = await getIdentityToken();
            if (!accessToken) return;

            const res = await fetch("/api/auth/wallet-session", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    identityToken,
                    walletAddress: embeddedWallet.address,
                }),
            });

            if (!res.ok) {
                console.error("Failed to create wallet session");
                sessionCreatedRef.current = false;
                return;
            }

            const data = await res.json();
            setWalletAddress(data.walletAddress);

            // Fetch full user profile from Supabase
            const supabase = createBrowserClient();
            const { data: profile } = await supabase
                .from("users")
                .select("*")
                .eq("wallet_address", data.walletAddress)
                .single();

            if (profile) {
                setUser(profile as AppUser);
            }
        } catch (error) {
            console.error("Session creation error:", error);
            sessionCreatedRef.current = false;
        } finally {
            setIsLoading(false);
        }
    }, [authenticated, embeddedWallet?.address, getAccessToken]);

    // ── Effect: handle auth state changes ────────────
    useEffect(() => {
        if (!ready) return;

        if (!authenticated) {
            setUser(null);
            setWalletAddress(null);
            setIsLoading(false);
            sessionCreatedRef.current = false;
            return;
        }

        if (embeddedWallet?.address) {
            setWalletAddress(embeddedWallet.address.toLowerCase());
            createSession();
        }
    }, [ready, authenticated, embeddedWallet?.address, createSession]);

    // ── Login ────────────────────────────────────────
    const login = useCallback(() => {
        privyLogin();
    }, [privyLogin]);

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

    return {
        user,
        walletAddress,
        isLoading: !ready || isLoading,
        isAuthenticated: authenticated && !!user,
        login,
        logout,
    };
}
