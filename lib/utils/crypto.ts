/**
 * Hashes a Blob using SHA-256.
 */
export async function hashBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Signs a piece of data using a transient key pair (for PoC).
 * In a production app, this would ideally use the user's Smart Account or a device-bound key (WebAuthn).
 */
export async function generateProofOfCapture(data: any) {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));

  // Generate a transient key pair for this session
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    keyPair.privateKey,
    encodedData
  );

  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    signature: Buffer.from(signature).toString("base64"),
    publicKey: Buffer.from(publicKey).toString("base64"),
    payload: data,
  };
}
