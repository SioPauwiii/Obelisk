import lighthouse from "@lighthouse-web3/sdk";

/**
 * Uploads a blob to Lighthouse (Filecoin/IPFS).
 */
export async function uploadToLighthouse(
    data: string | Blob | Buffer,
    name: string,
): Promise<{ hash: string; url: string }> {
    const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
    if (!apiKey) {
        throw new Error("Lighthouse API Key is not configured.");
    }

    try {
        let hash: string;

        // In Node.js, lighthouse.upload() expects a local file path string.
        // For metadata (JSON strings), we must use uploadText() to avoid File/Path errors.
        if (typeof data === "string") {
            const response = await lighthouse.uploadText(data, apiKey, name);
            hash = response.data.Hash;
        } else {
            // For browser environments (image uploads)
            let file: File;
            if (data instanceof Blob) {
                file = new File([data], name, { type: data.type });
            } else {
                file = new File([data as any], name);
            }
            const response = await lighthouse.upload([file], apiKey);
            hash = response.data.Hash;
        }

        const url = `https://sensitive-mockingbird-6dww5.lighthouseweb3.xyz/ipfs/${hash}`;

        return { hash, url };
    } catch (error) {
        console.error("Lighthouse upload failed:", error);
        throw new Error("Failed to archive data to decentralized storage.");
    }
}

/**
 * Bundles the image and its proof, archiving both to Lighthouse.
 */
export async function archiveMoment(
    imageBlob: Blob,
    proof: any,
): Promise<{
    imageHash: string;
    proofHash: string;
    imageUrl: string;
    proofUrl: string;
}> {
    // 1. Upload the image first
    const imageResult = await uploadToLighthouse(
        imageBlob,
        `image_${proof.payload.hash}.jpg`,
    );

    // 2. Attach the image IPFS hash to the proof for cross-referencing
    const linkedProof = {
        ...proof,
        ipfs: {
            imageHash: imageResult.hash,
            imageUrl: imageResult.url,
        },
    };

    // 3. Upload the linked proof JSON
    const proofBlob = new Blob([JSON.stringify(linkedProof, null, 2)], {
        type: "application/json",
    });
    const proofResult = await uploadToLighthouse(
        proofBlob,
        `proof_${proof.payload.hash}.json`,
    );

    return {
        imageHash: imageResult.hash,
        proofHash: proofResult.hash,
        imageUrl: imageResult.url,
        proofUrl: proofResult.url,
    };
}
