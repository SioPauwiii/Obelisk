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
        // For browser environments, creating a File object and using lighthouse.upload
        // is the most reliable way to preserve the filename and metadata.
        let file: File;
        if (data instanceof Blob) {
            file = new File([data], name, { type: data.type });
        } else if (typeof data === "string") {
            file = new File([data], name, { type: "text/plain" });
        } else {
            file = new File([data as any], name);
        }

        // lighthouse.upload takes an array of files or a FileList
        const response = await lighthouse.upload([file], apiKey);

        // Response structure: { data: { Name, Hash, Size } }
        const hash = response.data.Hash;
        const url = `https://gateway.lighthouse.storage/ipfs/${hash}`;

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
