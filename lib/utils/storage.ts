import lighthouse from "@lighthouse-web3/sdk";

type ProofPayload = {
    payload: {
        hash?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

type ArchiveInput = {
    blob: Blob;
    proof: ProofPayload;
    label: string;
};

type ArchiveResult = {
    hash: string;
    url: string;
};

type ArchiveMomentsResult = {
    imageHashes: string[];
    proofHashes: string[];
    imageUrls: string[];
    proofUrls: string[];
};

/**
 * Uploads a blob to Lighthouse (Filecoin/IPFS).
 */
export async function uploadToLighthouse(
    data: string | Blob | Buffer,
    name: string,
): Promise<ArchiveResult> {
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
 * Bundles a single image and its proof, archiving both to Lighthouse.
 */
export async function archiveMoment(
    imageBlob: Blob,
    proof: ProofPayload,
): Promise<{
    imageHash: string;
    proofHash: string;
    imageUrl: string;
    proofUrl: string;
}> {
    const result = await archiveMoments([
        { blob: imageBlob, proof, label: proof.payload.hash ?? "image_0" },
    ]);

    return {
        imageHash: result.imageHashes[0],
        proofHash: result.proofHashes[0],
        imageUrl: result.imageUrls[0],
        proofUrl: result.proofUrls[0],
    };
}

/**
 * Bundles multiple images and their proofs, archiving each pair to Lighthouse.
 */
export async function archiveMoments(
    captures: ArchiveInput[],
): Promise<ArchiveMomentsResult> {
    const imageHashes: string[] = [];
    const proofHashes: string[] = [];
    const imageUrls: string[] = [];
    const proofUrls: string[] = [];

    for (let index = 0; index < captures.length; index += 1) {
        const capture = captures[index];
        const imageResult = await uploadToLighthouse(
            capture.blob,
            `image_${capture.label}_${index}.jpg`,
        );

        const linkedProof = {
            ...capture.proof,
            ipfs: {
                imageHash: imageResult.hash,
                imageUrl: imageResult.url,
                captureIndex: index,
            },
        };

        const proofBlob = new Blob([JSON.stringify(linkedProof, null, 2)], {
            type: "application/json",
        });
        const proofResult = await uploadToLighthouse(
            proofBlob,
            `proof_${capture.label}_${index}.json`,
        );

        imageHashes.push(imageResult.hash);
        proofHashes.push(proofResult.hash);
        imageUrls.push(imageResult.url);
        proofUrls.push(proofResult.url);
    }

    return {
        imageHashes,
        proofHashes,
        imageUrls,
        proofUrls,
    };
}
