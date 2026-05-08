"use client";

import { usePrivy } from "@privy-io/react-auth";

export function usePrivyAuth() {
    const { ready, authenticated, user, login, logout, getAccessToken } =
        usePrivy();

    const getToken = async (): Promise<string | null> => {
        if (!authenticated) return null;
        return getAccessToken();
    };

    const walletAddress =
        user?.wallet?.address ??
        user?.linkedAccounts?.find((account) => account.type === "wallet")
            ?.address ??
        null;

    return {
        ready,
        authenticated,
        user,
        walletAddress,
        login,
        logout,
        getToken,
    };
}
