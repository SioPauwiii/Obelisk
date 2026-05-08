import { createPublicClient, createWalletClient, http, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { SBT_ABI, SBT_CONTRACT_ADDRESS, SBT_CHAIN_ID } from "./sbt";
import { uploadToLighthouse } from "@/lib/utils/storage";
import { createAdminClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  title: string;
  caption: string | null;
  pillar: string;
  image_url: string;
  proof_url: string;
  liveness_score: number | null;
  captured_at: string;
  sbt_mint_attempts: number;
}

interface MintResult {
  success: boolean;
  txHash?: string;
  tokenId?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [0, 5_000, 15_000]; // delay before attempt 1, 2, 3

// ─────────────────────────────────────────────────────────────────────────────
// Internal: build + upload NFT metadata to Lighthouse
// ─────────────────────────────────────────────────────────────────────────────

async function buildAndUploadMetadata(post: Post): Promise<string> {
  const metadata = {
    name: `Obelisk Archive — ${post.title}`,
    description:
      post.caption ??
      "A cryptographically verified human moment, permanently archived on the Obelisk Humanity Archive.",
    image: post.image_url,
    external_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/posts/${post.id}`,
    attributes: [
      { trait_type: "Pillar",         value: post.pillar },
      { trait_type: "Captured At",    value: post.captured_at },
      { trait_type: "Liveness Score", value: post.liveness_score ?? 0 },
      { trait_type: "Post ID",        value: post.id },
      { trait_type: "Chain",          value: "Avalanche Fuji" },
      { trait_type: "Chain ID",       value: SBT_CHAIN_ID },
    ],
  };

  const { url } = await uploadToLighthouse(
    JSON.stringify(metadata, null, 2),
    `sbt_metadata_${post.id}.json`,
  );

  return url; // IPFS gateway URL — used as tokenURI
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: execute the on-chain mint
// ─────────────────────────────────────────────────────────────────────────────

async function executeOnChainMint(
  recipientAddress: string,
  metadataUri: string,
  postId: string,
): Promise<{ txHash: string; tokenId: string }> {
  const privateKey = process.env.MINTER_PRIVATE_KEY;
  if (!privateKey) throw new Error("MINTER_PRIVATE_KEY is not configured");

  const account = privateKeyToAccount(`0x${privateKey.replace(/^0x/, "")}`);

  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL),
  });

  // Submit the mint transaction
  const txHash = await walletClient.writeContract({
    address: SBT_CONTRACT_ADDRESS as `0x${string}`,
    abi: [parseAbiItem("function safeMint(address to, string calldata uri, string calldata postId) external returns (uint256)")],
    functionName: "safeMint",
    args: [recipientAddress as `0x${string}`, metadataUri, postId],
  });

  // Wait for confirmation (1 block)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status !== "success") {
    throw new Error(`Transaction reverted. Hash: ${txHash}`);
  }

  // Parse SBTMinted event to extract token ID
  const mintedEvent = receipt.logs.find((log) => {
    try {
      // Topic[0] is the event signature hash for SBTMinted
      return log.topics[0] === "0x" + /* keccak256("SBTMinted(address,uint256,string,string)") */ "a0f84b08";
    } catch {
      return false;
    }
  });

  // Token ID from topic[2] (2nd indexed param)
  const tokenId = mintedEvent?.topics[2]
    ? BigInt(mintedEvent.topics[2]).toString()
    : "0";

  return { txHash, tokenId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: mintSBT — called after first vouch, with built-in retry
// ─────────────────────────────────────────────────────────────────────────────

export async function mintSBT(
  post: Post,
  recipientWalletAddress: string,
): Promise<MintResult> {
  const supabase = createAdminClient();
  const attempts = (post.sbt_mint_attempts ?? 0) + 1;

  // Mark as 'minting' in DB
  await supabase
    .from("posts")
    .update({
      sbt_mint_status: "minting",
      sbt_mint_attempts: attempts,
      sbt_mint_error: null,
    })
    .eq("id", post.id);

  try {
    // Step 1 — upload metadata to Lighthouse
    const metadataUri = await buildAndUploadMetadata(post);

    // Step 2 — mint on-chain
    const { txHash, tokenId } = await executeOnChainMint(
      recipientWalletAddress,
      metadataUri,
      post.id,
    );

    // Step 3 — update DB with success
    await supabase
      .from("posts")
      .update({
        tx_hash:          txHash,
        contract_address: SBT_CONTRACT_ADDRESS,
        chain_id:         SBT_CHAIN_ID,
        sbt_token_id:     tokenId,
        sbt_minted_at:    new Date().toISOString(),
        sbt_mint_status:  "success",
        sbt_mint_error:   null,
      })
      .eq("id", post.id);

    console.log(`[mintSBT] ✅ Post ${post.id} → token #${tokenId} | tx: ${txHash}`);
    return { success: true, txHash, tokenId };

  } catch (err: any) {
    const errorMsg = err?.message ?? String(err);
    const isPermanentlyFailed = attempts >= MAX_ATTEMPTS;

    await supabase
      .from("posts")
      .update({
        sbt_mint_status: isPermanentlyFailed ? "failed_permanent" : "failed",
        sbt_mint_error:  errorMsg,
        sbt_mint_attempts: attempts,
      })
      .eq("id", post.id);

    console.error(
      `[mintSBT] ❌ Post ${post.id} failed (attempt ${attempts}/${MAX_ATTEMPTS}): ${errorMsg}`,
    );

    return { success: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: retryFailedMints — called by POST /api/admin/retry-sbt
// Picks up all posts with sbt_mint_status = 'pending' | 'failed'
// and attempts to re-mint, respecting MAX_ATTEMPTS.
// ─────────────────────────────────────────────────────────────────────────────

export async function retryFailedMints(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const supabase = createAdminClient();

  // Fetch posts that need minting, with their author's wallet address
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id, title, caption, pillar, image_url, proof_url, liveness_score,
      captured_at, sbt_mint_attempts,
      users!posts_user_id_fkey ( wallet_address )
    `)
    .in("sbt_mint_status", ["pending", "failed"])
    .lt("sbt_mint_attempts", MAX_ATTEMPTS)
    .limit(20); // Process in batches

  if (error || !posts || posts.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const post of posts) {
    const walletAddress = (post.users as any)?.wallet_address as string | null;
    if (!walletAddress) {
      console.warn(`[retryFailedMints] Post ${post.id} has no wallet address, skipping`);
      failed++;
      continue;
    }

    // Stagger retries to avoid hammering the RPC
    const delayMs = RETRY_DELAY_MS[Math.min(post.sbt_mint_attempts, RETRY_DELAY_MS.length - 1)];
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

    const result = await mintSBT(post as Post, walletAddress);
    result.success ? succeeded++ : failed++;
  }

  return { processed: posts.length, succeeded, failed };
}
