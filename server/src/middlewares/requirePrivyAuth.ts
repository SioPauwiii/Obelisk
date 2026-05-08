import type { NextFunction, Request, Response } from "express";
import { getPrivyClient } from "../lib/privy";
import type { AuthenticatedUser } from "../types/auth";

interface PrivyLinkedAccount {
    type?: string;
    address?: string;
}

interface PrivyUserLike {
    id?: string;
    wallet?: { address?: string };
    linkedAccounts?: PrivyLinkedAccount[];
    linked_accounts?: PrivyLinkedAccount[];
}

function resolveWalletAddress(user: PrivyUserLike): string | null {
    if (typeof user.wallet?.address === "string") {
        return user.wallet.address;
    }

    const accounts = user.linkedAccounts ?? user.linked_accounts ?? [];
    const walletAccount = accounts.find((account) => account.type === "wallet");

    return walletAccount?.address ?? null;
}

function parseBearerToken(headerValue?: string): string | null {
    if (!headerValue) return null;
    const [scheme, token] = headerValue.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) return null;
    return token;
}

export async function requirePrivyAuth(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const token = parseBearerToken(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Missing Authorization bearer token",
            });
        }

        const privyClient = getPrivyClient();
        const claims = await privyClient.verifyAuthToken(token);

        if (!claims?.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token: missing user identifier",
            });
        }

        const privyUser = (await privyClient.getUser(claims.userId)) as PrivyUserLike;

        const user: AuthenticatedUser = {
            did: privyUser.id ?? claims.userId,
            walletAddress: resolveWalletAddress(privyUser),
            claims: claims as unknown as Record<string, unknown>,
        };

        req.user = user;
        return next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}
