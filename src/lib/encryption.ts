// Client-side encryption utilities using Web Crypto API

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
}

// Derive encryption key from wallet public key
async function deriveKey(
  walletPublicKey: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(walletPublicKey),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt file data
export async function encryptFile(
  fileData: ArrayBuffer,
  walletPublicKey: string
): Promise<EncryptionResult> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(walletPublicKey, salt);

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    fileData
  );

  return { encryptedData, iv, salt };
}

// Decrypt file data
export async function decryptFile(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  salt: Uint8Array,
  walletPublicKey: string
): Promise<ArrayBuffer> {
  const key = await deriveKey(walletPublicKey, salt);

  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData
  );
}

// Generate content hash (CID-like)
export async function generateContentHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `bafybeig${hashHex.slice(0, 52)}`;
}

// Convert ArrayBuffer to base64 for storage
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

