import { createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

export const config = createConfig({
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL),
  },
});
