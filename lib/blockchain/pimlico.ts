import { createPimlicoClient } from "permissionless/clients/pimlico";
import { http } from "viem";
import { avalancheFuji } from "viem/chains";

const pimlicoUrl = `https://api.pimlico.io/v2/avalanche-fuji/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`;

export const pimlicoClient = createPimlicoClient({
  chain: avalancheFuji,
  transport: http(pimlicoUrl),
});
