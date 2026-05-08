import { PrivyClient } from "@privy-io/server-auth";
import { env } from "../config/env";

let privyClientInstance: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
    if (!privyClientInstance) {
        privyClientInstance = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
    }

    return privyClientInstance;
}
