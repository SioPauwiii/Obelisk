export interface AuthenticatedUser {
    did: string;
    walletAddress: string | null;
    claims: Record<string, unknown>;
}
