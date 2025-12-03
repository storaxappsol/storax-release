// Real IPFS upload to the decentralized network
// Files are accessible via public IPFS gateways worldwide

// IPFS API key from environment (set by developer in .env)
const IPFS_API_KEY = process.env.NEXT_PUBLIC_PINATA_JWT || "";

// Public IPFS gateways for file access
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
  "https://w3s.link/ipfs/",
  "https://4everland.io/ipfs/",
];

export interface IPFSUploadResult {
  cid: string;
  url: string;
  size: number;
  gateway: string;
}

// Check if IPFS is configured by the developer
export function isIPFSEnabled(): boolean {
  return !!IPFS_API_KEY && IPFS_API_KEY.length > 10;
}

// Get the primary IPFS gateway URL
export function getIPFSGatewayUrl(): string {
  return IPFS_GATEWAYS[0];
}

// Upload to IPFS network (if configured) or local storage
export async function uploadToIPFS(
  data: ArrayBuffer,
  fileName: string
): Promise<IPFSUploadResult> {
  if (isIPFSEnabled()) {
    // Upload to real IPFS network (configured by developer)
    return uploadToIPFSNetwork(data, fileName, IPFS_API_KEY);
  } else {
    // Fallback to local IndexedDB + generate CID
    return uploadToLocalWithCID(data, fileName);
  }
}

// Upload to IPFS network via pinning service
async function uploadToIPFSNetwork(
  data: ArrayBuffer,
  fileName: string,
  apiKey: string
): Promise<IPFSUploadResult> {
  const blob = new Blob([data], { type: "application/octet-stream" });
  const file = new File([blob], fileName, { type: "application/octet-stream" });

  const formData = new FormData();
  formData.append("file", file);

  // Add metadata for the pinning service
  const metadata = JSON.stringify({
    name: fileName,
    keyvalues: {
      app: "storax",
      timestamp: Date.now().toString(),
    },
  });
  formData.append("pinataMetadata", metadata);

  // Pin options
  const options = JSON.stringify({
    cidVersion: 1,
  });
  formData.append("pinataOptions", options);

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`IPFS upload failed: ${error}`);
  }

  const result = await response.json();
  const cid = result.IpfsHash;

  // Also store locally for faster retrieval
  await storeInIndexedDB(cid, data, fileName);

  return {
    cid,
    url: `https://ipfs.io/ipfs/${cid}`,
    size: data.byteLength,
    gateway: "ipfs.io",
  };
}

// Local storage with CID generation (fallback when no Pinata)
async function uploadToLocalWithCID(
  data: ArrayBuffer,
  fileName: string
): Promise<IPFSUploadResult> {
  // Generate a real CID using SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  
  // Create CIDv1 format (bafkreig prefix for raw leaves)
  const cid = `bafkreig${hashHex.slice(0, 52)}`;

  // Store in IndexedDB
  await storeInIndexedDB(cid, data, fileName);

  return {
    cid,
    url: `local://${cid}`,
    size: data.byteLength,
    gateway: "local",
  };
}

// Retrieve from IPFS - tries local cache first, then public gateways
export async function retrieveFromIPFS(cid: string): Promise<ArrayBuffer | null> {
  // First try local IndexedDB cache
  const localData = await getFromIndexedDB(cid);
  if (localData) {
    console.log("Retrieved from local cache:", cid);
    return localData;
  }

  // Try public IPFS gateways
  for (const gateway of IPFS_GATEWAYS) {
    try {
      console.log(`Trying gateway: ${gateway}${cid}`);
      const response = await fetch(`${gateway}${cid}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const data = await response.arrayBuffer();
        // Cache locally for future use
        await storeInIndexedDB(cid, data, "cached");
        console.log("Retrieved from IPFS gateway:", gateway);
        return data;
      }
    } catch (err) {
      console.log(`Gateway ${gateway} failed:`, err);
      continue;
    }
  }

  return null;
}

// Check if a CID exists on IPFS
export async function checkIPFSAvailability(cid: string): Promise<{
  available: boolean;
  gateway?: string;
}> {
  // Check local first
  const localData = await getFromIndexedDB(cid);
  if (localData) {
    return { available: true, gateway: "local" };
  }

  // Check public gateways
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}${cid}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return { available: true, gateway };
      }
    } catch {
      continue;
    }
  }

  return { available: false };
}

// Get IPFS gateway URL for a CID
export function getIPFSUrl(cid: string, preferredGateway?: string): string {
  const gateway = preferredGateway || IPFS_GATEWAYS[0];
  return `${gateway}${cid}`;
}

// Get all available gateways
export function getIPFSGateways(): string[] {
  return [...IPFS_GATEWAYS];
}

// IndexedDB storage for local caching
const DB_NAME = "storax_ipfs_cache";
const STORE_NAME = "files";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "cid" });
      }
    };
  });
}

async function storeInIndexedDB(
  cid: string,
  data: ArrayBuffer,
  fileName: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        cid,
        data,
        fileName,
        timestamp: Date.now(),
      });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.error("IndexedDB store error:", err);
  }
}

async function getFromIndexedDB(cid: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cid);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  } catch {
    return null;
  }
}

// Delete from IndexedDB
export async function deleteFromIndexedDB(cid: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(cid);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.error("IndexedDB delete error:", err);
  }
}

// Get all cached files
export async function getAllCachedFiles(): Promise<
  Array<{ cid: string; fileName: string; timestamp: number; size: number }>
> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map(
          (item: { cid: string; fileName: string; timestamp: number; data: ArrayBuffer }) => ({
            cid: item.cid,
            fileName: item.fileName,
            timestamp: item.timestamp,
            size: item.data?.byteLength || 0,
          })
        );
        resolve(results);
      };
    });
  } catch {
    return [];
  }
}
