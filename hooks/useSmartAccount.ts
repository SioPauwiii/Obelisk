import { useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";
import { pimlicoClient } from "@/lib/blockchain/pimlico";

export const useSmartAccount = () => {
  const { wallets } = useWallets();
  const [smartAccountClient, setSmartAccountClient] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

  useEffect(() => {
    const initSmartAccount = async () => {
      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      
      if (embeddedWallet) {
        const provider = await embeddedWallet.getEthereumProvider();
        const publicClient = createPublicClient({
          chain: avalancheFuji,
          transport: http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL),
        });

        // Derive Safe Smart Account
        const safeAccount = await toSafeSmartAccount({
          client: publicClient,
          owners: [provider as any], // Privy provider works as a signer
          version: "1.4.1",
          entryPoint: {
            address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint v0.6
            version: "0.6",
          },
        });

        const client = createSmartAccountClient({
          account: safeAccount,
          chain: avalancheFuji,
          bundlerTransport: http(pimlicoClient.transport.url),
          paymaster: pimlicoClient,
          userOperation: {
            estimateFeesPerGas: async () => {
              return (await pimlicoClient.getUserOperationGasPrice()).fast;
            },
          },
        });

        setSmartAccountClient(client);
        setSmartAccountAddress(safeAccount.address);
      }
    };

    initSmartAccount();
  }, [wallets]);

  return { smartAccountClient, smartAccountAddress };
};
