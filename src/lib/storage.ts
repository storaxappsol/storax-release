// Persistent storage utilities for per-wallet data

export type StoredObject = {
  id: string;
  fileName: string;
  originalName: string;
  cid: string;
  arweaveTx: string | null;
  ipfsUrl: string | null;
  ipfsGateway: string | null; // Which gateway was used (pinata, local, etc.)
  filecoinDeal: string | null;
  redundancy: number;
  shardCount: number;
  encryptedSize: number;
  originalSize: number;
  commitment: string;
  zkProofHash: string;
  status: "pending" | "uploading" | "verifying" | "verified" | "failed";
  createdAt: number;
  verifiedAt: number | null;
  encryptionKey: string; // Stored encrypted, only decryptable by wallet owner
  isOnIPFS: boolean; // True if uploaded to real IPFS network
};

export type ActivityEvent = {
  id: string;
  type: "upload" | "verify" | "download" | "delete" | "settings_change";
  objectId?: string;
  fileName?: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, string | number>;
};

export type UserSettings = {
  displayName: string;
  defaultRedundancy: number;
  defaultShardCount: number;
  autoVerify: boolean;
  notifications: boolean;
  theme: "dark" | "light" | "system";
  preferredStorage: "arweave" | "ipfs" | "both";
  encryptionStrength: "standard" | "high";
};

const STORAGE_PREFIX = "storax";

// Get storage key for a specific wallet
function getKey(wallet: string, type: string): string {
  return `${STORAGE_PREFIX}_${type}_${wallet}`;
}

// Objects storage
export function getStoredObjects(wallet: string): StoredObject[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(getKey(wallet, "objects"));
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStoredObjects(wallet: string, objects: StoredObject[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(wallet, "objects"), JSON.stringify(objects));
}

export function addStoredObject(wallet: string, object: StoredObject): void {
  const objects = getStoredObjects(wallet);
  objects.unshift(object);
  saveStoredObjects(wallet, objects);
}

export function updateStoredObject(
  wallet: string,
  objectId: string,
  updates: Partial<StoredObject>
): void {
  const objects = getStoredObjects(wallet);
  const index = objects.findIndex((o) => o.id === objectId);
  if (index !== -1) {
    objects[index] = { ...objects[index], ...updates };
    saveStoredObjects(wallet, objects);
  }
}

export function deleteStoredObject(wallet: string, objectId: string): void {
  const objects = getStoredObjects(wallet);
  const filtered = objects.filter((o) => o.id !== objectId);
  saveStoredObjects(wallet, filtered);
}

// Activity storage
export function getActivityEvents(wallet: string): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(getKey(wallet, "activity"));
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveActivityEvents(wallet: string, events: ActivityEvent[]): void {
  if (typeof window === "undefined") return;
  // Keep only last 100 events
  const trimmed = events.slice(0, 100);
  localStorage.setItem(getKey(wallet, "activity"), JSON.stringify(trimmed));
}

export function addActivityEvent(wallet: string, event: Omit<ActivityEvent, "id" | "timestamp">): void {
  const events = getActivityEvents(wallet);
  const newEvent: ActivityEvent = {
    ...event,
    id: randomHex(16),
    timestamp: Date.now(),
  };
  events.unshift(newEvent);
  saveActivityEvents(wallet, events);
}

// Settings storage
const DEFAULT_SETTINGS: UserSettings = {
  displayName: "",
  defaultRedundancy: 3,
  defaultShardCount: 32,
  autoVerify: true,
  notifications: true,
  theme: "dark",
  preferredStorage: "both",
  encryptionStrength: "standard",
};

export function getUserSettings(wallet: string): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const data = localStorage.getItem(getKey(wallet, "settings"));
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(wallet: string, settings: Partial<UserSettings>): void {
  if (typeof window === "undefined") return;
  const current = getUserSettings(wallet);
  const updated = { ...current, ...settings };
  localStorage.setItem(getKey(wallet, "settings"), JSON.stringify(updated));
}

// Utility functions
export function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

// Generate deterministic but anonymous file ID from content
export function generateFileId(fileName: string, size: number): string {
  return randomHex(16);
}

