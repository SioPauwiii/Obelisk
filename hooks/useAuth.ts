"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface AppUser {
    id: string;
    privy_did: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    wallet_address: string | null;
    auth_provider: string;
    is_verified_human: boolean;
    humanity_score: number;
    country: string | null;
    pillar_preference: string | null;
    voucher_count: number;
    created_at: string;
    updated_at: string;
}

export type LoginMethod = "google" | "apple" | "email" | "wallet";

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
    const { createWallet } = useCreateWallet();

    const [user, setUser] = useState<AppUser | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const sessionCreatedRef = useRef(false);
    const walletCreationAttemptedRef = useRef(false);

    // ── Resolve wallet address from all sources ──────
    const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
    );
    const activeWallet = embeddedWallet ?? wallets[0] ?? null;
    const resolvedWalletAddress =
        activeWallet?.address ??
        privyUser?.wallet?.address ??
        null;

    // ── Stable ref ───────────────────────────────────
    const getAccessTokenRef = useRef(getAccessToken);
    getAccessTokenRef.current = getAccessToken;

    // ── Create session — NO wallet required ──────────
    const createSession = useCallback(async () => {
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
                // No body — server gets everything from the Privy token
            });

            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                setAuthError(
                    payload?.error ??
                        "Unable to finish sign-in. Please try again."
                );
                sessionCreatedRef.current = false;
                return;
            }

            const data = payload as {
                user?: AppUser;
                walletAddress: string | null;
            };
            if (data.walletAddress) {
                setWalletAddress(data.walletAddress);
            }
            if (data.user) {
                setUser(data.user);
            }
        } catch {
            setAuthError("Unable to finish sign-in. Please try again.");
            sessionCreatedRef.current = false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Effect: create session IMMEDIATELY on auth ───
    useEffect(() => {
        if (!ready) return;

        if (!authenticated) {
            setUser(null);
            setWalletAddress(null);
            setAuthError(null);
            setIsLoading(false);
            sessionCreatedRef.current = false;
            walletCreationAttemptedRef.current = false;
            return;
        }

        // Authenticated — create session immediately
        // Server will get wallet from Privy API (no client wallet needed)
        createSession();
    }, [ready, authenticated, createSession]);

    // ── Effect: create embedded wallet if none exists ─
    // Privy's createOnLogin does NOT work with loginWithCode / initOAuth,
    // so we must manually create the wallet after authentication.
    useEffect(() => {
        if (!ready || !authenticated || !privyUser) return;
        if (walletCreationAttemptedRef.current) return;
        if (resolvedWalletAddress) {
            setWalletAddress(resolvedWalletAddress.toLowerCase());
            return;
        }

        walletCreationAttemptedRef.current = true;

        createWallet()
            .then((wallet) => {
                if (wallet?.address) {
                    setWalletAddress(wallet.address.toLowerCase());
                    // Fire-and-forget: update the server with the new wallet
                    getAccessTokenRef.current().then((token) => {
                        if (!token) return;
                        fetch("/api/auth/wallet-session", {
                            method: "PATCH",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                walletAddress: wallet.address,
                            }),
                        }).catch(() => {});
                    });
                }
            })
            .catch(() => {
                // Non-critical — user can still use the app without a
                // client-side embedded wallet (e.g. wallet already exists
                // on Privy but isn't connected in this browser)
            });
    }, [ready, authenticated, privyUser, resolvedWalletAddress, createWallet]);

    // ── Login ────────────────────────────────────────
    const login = useCallback(
        (method?: LoginMethod) => {
            setAuthError(null);
            if (method === "wallet") {
                privyLogin();
                return;
            }
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
            await fetch("/api/auth/logout", { method: "POST" });
            await privyLogout();
            setUser(null);
            setWalletAddress(null);
            sessionCreatedRef.current = false;
            walletCreationAttemptedRef.current = false;
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [privyLogout]);

    const clearError = useCallback(() => setAuthError(null), []);

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
