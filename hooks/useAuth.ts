"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface AppUser {
    id: string;
    privy_did: string;
    handle: string | null;
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
    const [authError, setAuthError] = useState<string | null>(null);
    const sessionCreatedRef = useRef(false);
    const walletCreationAttemptedRef = useRef(false);

    // ── Resolve wallet address from all sources ──────
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    const activeWallet = embeddedWallet ?? wallets[0] ?? null;
    const resolvedWalletAddress =
        activeWallet?.address ?? privyUser?.wallet?.address ?? null;

    // ── Effect: create session IMMEDIATELY on auth ───
    useEffect(() => {
        if (!ready) return;

        if (!authenticated) {
            sessionCreatedRef.current = false;
            walletCreationAttemptedRef.current = false;
            return;
        }

        if (sessionCreatedRef.current) return;

        // Authenticated — create session immediately
        // Server will get wallet from Privy API (no client wallet needed)
        sessionCreatedRef.current = true;

        void (async () => {
            try {
                const accessToken = await getAccessToken();
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
                        walletAddress: resolvedWalletAddress,
                    }),
                });

                const payload = await res.json().catch(() => null);

                if (!res.ok) {
                    setAuthError(
                        payload?.error ??
                            "Unable to finish sign-in. Please try again.",
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
            }
        })();
    }, [ready, authenticated, getAccessToken]);

    // ── Effect: create embedded wallet if none exists ─
    // Privy's createOnLogin does NOT work with loginWithCode / initOAuth,
    // so we must manually create the wallet after authentication.
    useEffect(() => {
        if (!ready || !authenticated || !privyUser) return;
        if (walletCreationAttemptedRef.current) return;
        if (resolvedWalletAddress) {
            return;
        }

        walletCreationAttemptedRef.current = true;

        createWallet()
            .then((wallet) => {
                if (wallet?.address) {
                    setWalletAddress(wallet.address.toLowerCase());
                    // Fire-and-forget: update the server with the new wallet
                    getAccessToken().then((token) => {
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
    }, [
        ready,
        authenticated,
        privyUser,
        resolvedWalletAddress,
        createWallet,
        getAccessToken,
    ]);

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
        [privyLogin],
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

    const effectiveUser = authenticated ? user : null;
    const effectiveWalletAddress = authenticated
        ? (resolvedWalletAddress?.toLowerCase() ?? walletAddress)
        : null;
    const effectiveAuthError = authenticated ? authError : null;
    const effectiveIsLoading =
        !ready || (authenticated && !effectiveUser && !effectiveAuthError);

    return {
        user: effectiveUser,
        walletAddress: effectiveWalletAddress,
        isLoading: effectiveIsLoading,
        isAuthenticated: authenticated && !!effectiveUser,
        authError: effectiveAuthError,
        login,
        logout,
        clearError,
    };
}
