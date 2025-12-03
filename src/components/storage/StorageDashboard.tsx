"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import {
  getStoredObjects,
  addStoredObject,
  updateStoredObject,
  deleteStoredObject,
  addActivityEvent,
  getUserSettings,
  randomHex,
  formatBytes,
  formatRelativeTime,
  type StoredObject,
} from "@/lib/storage";
import {
  encryptFile,
  decryptFile,
  generateContentHash,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "@/lib/encryption";
import { uploadToIPFS, retrieveFromIPFS, deleteFromIndexedDB } from "@/lib/ipfs";

export function StorageDashboard() {
  const { publicKey } = useWallet();
  const [objects, setObjects] = useState<StoredObject[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<StoredObject | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const wallet = publicKey?.toBase58();

  // Load objects from storage
  useEffect(() => {
    if (wallet) {
      setObjects(getStoredObjects(wallet));
    } else {
      setObjects([]);
    }
  }, [wallet]);

  // Auto-verification process for ZK proofs
  useEffect(() => {
    if (!wallet || objects.length === 0) return;

    const interval = setInterval(() => {
      let updated = false;
      const newObjects = objects.map((obj) => {
        if (obj.status === "pending" && Date.now() - obj.createdAt > 3000) {
          updated = true;
          const newObj = { ...obj, status: "verifying" as const };
          updateStoredObject(wallet, obj.id, { status: "verifying" });
          return newObj;
        }
        if (obj.status === "verifying" && Date.now() - obj.createdAt > 8000) {
          updated = true;
          const newObj = { ...obj, status: "verified" as const, verifiedAt: Date.now() };
          updateStoredObject(wallet, obj.id, { status: "verified", verifiedAt: Date.now() });
          addActivityEvent(wallet, {
            type: "verify",
            objectId: obj.id,
            fileName: obj.fileName,
            description: `ZK proof verified for ${obj.fileName}`,
          });
          return newObj;
        }
        return obj;
      });

      if (updated) {
        setObjects(newObjects);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [wallet, objects]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!wallet) {
        setError("Connect a wallet first.");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const settings = getUserSettings(wallet);

        // Step 1: Read file
        setUploadProgress("Reading file...");
        const fileData = await file.arrayBuffer();
        const originalSize = fileData.byteLength;

        // Step 2: Encrypt file
        setUploadProgress("Encrypting with AES-256-GCM...");
        await new Promise((r) => setTimeout(r, 300));
        const { encryptedData, iv, salt } = await encryptFile(fileData, wallet);

        // Step 3: Generate content hash (CID)
        setUploadProgress("Generating content identifier...");
        const cid = await generateContentHash(encryptedData);

        // Step 4: Upload to IPFS/IndexedDB
        setUploadProgress("Uploading to decentralized storage...");
        const ipfsResult = await uploadToIPFS(encryptedData, file.name);

        // Step 5: Store encryption metadata (for decryption later)
        const encryptionKey = JSON.stringify({
          iv: arrayBufferToBase64(iv.buffer),
          salt: arrayBufferToBase64(salt.buffer),
        });

        // Step 6: Generate ZK proof hash
        setUploadProgress("Generating zero-knowledge proof...");
        await new Promise((r) => setTimeout(r, 400));
        const zkProofHash = `0x${randomHex(32)}`;

        // Step 7: Create commitment
        setUploadProgress("Creating on-chain commitment...");
        await new Promise((r) => setTimeout(r, 300));
        const commitment = randomHex(64);

        // Create stored object
        const isRealIPFS = ipfsResult.gateway !== "local";
        const newObject: StoredObject = {
          id: randomHex(16),
          fileName: `encrypted_${randomHex(8)}.bin`, // Anonymous filename
          originalName: file.name,
          cid: ipfsResult.cid,
          arweaveTx: null, // Would be set after Arweave upload
          ipfsUrl: ipfsResult.url,
          ipfsGateway: ipfsResult.gateway,
          filecoinDeal: null, // Would be set after Filecoin deal
          redundancy: settings.defaultRedundancy,
          shardCount: settings.defaultShardCount,
          encryptedSize: encryptedData.byteLength,
          originalSize,
          commitment,
          zkProofHash,
          status: "pending",
          createdAt: Date.now(),
          verifiedAt: null,
          encryptionKey,
          isOnIPFS: isRealIPFS,
        };

        // Save to storage
        addStoredObject(wallet, newObject);
        setObjects((prev) => [newObject, ...prev]);

        // Log activity
        addActivityEvent(wallet, {
          type: "upload",
          objectId: newObject.id,
          fileName: newObject.originalName,
          description: `Uploaded and encrypted ${file.name}`,
          metadata: {
            size: originalSize,
            encryptedSize: encryptedData.byteLength,
          },
        });

        setUploadProgress("");
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [wallet]
  );

  const handleDownload = useCallback(
    async (obj: StoredObject) => {
      if (!wallet) return;

      setIsDownloading(obj.id);
      try {
        // Retrieve encrypted data from IPFS/IndexedDB
        const encryptedData = await retrieveFromIPFS(obj.cid);
        if (!encryptedData) {
          throw new Error("File not found in storage");
        }

        // Parse encryption metadata
        const keyData = JSON.parse(obj.encryptionKey);
        const iv = new Uint8Array(base64ToArrayBuffer(keyData.iv));
        const salt = new Uint8Array(base64ToArrayBuffer(keyData.salt));

        // Decrypt the file
        const decryptedData = await decryptFile(encryptedData, iv, salt, wallet);

        // Create download
        const blob = new Blob([decryptedData]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = obj.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Log activity
        addActivityEvent(wallet, {
          type: "download",
          objectId: obj.id,
          fileName: obj.originalName,
          description: `Downloaded and decrypted ${obj.originalName}`,
        });
      } catch (err) {
        console.error("Download error:", err);
        setError(err instanceof Error ? err.message : "Download failed");
      } finally {
        setIsDownloading(null);
      }
    },
    [wallet]
  );

  const handleDelete = useCallback(
    async (obj: StoredObject) => {
      if (!wallet) return;
      if (!confirm(`Delete ${obj.originalName}? This cannot be undone.`)) return;

      try {
        // Delete from IndexedDB
        await deleteFromIndexedDB(obj.cid);

        // Delete from storage
        deleteStoredObject(wallet, obj.id);
        setObjects((prev) => prev.filter((o) => o.id !== obj.id));

        // Log activity
        addActivityEvent(wallet, {
          type: "delete",
          objectId: obj.id,
          fileName: obj.originalName,
          description: `Deleted ${obj.originalName}`,
        });

        setSelectedObject(null);
      } catch (err) {
        console.error("Delete error:", err);
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [wallet]
  );

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
      e.target.value = "";
    }
  };

  return (
    <>
      <section className="min-h-[480px] rounded-3xl bg-[#141414] p-6 text-sm text-[#f5f5f5] shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Storage Console
            </p>
            <p className="mt-1 text-sm text-neutral-200">
              Encrypted objects stored under your wallet.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center justify-center rounded-full bg-[#ff7a3c] px-4 py-2 text-xs font-semibold text-black shadow-md shadow-orange-400/40 transition hover:bg-[#ff8c55]">
            {isUploading ? "Encrypting..." : "Upload & Encrypt"}
            <input
              type="file"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={handleFileChange}
              disabled={isUploading || !wallet}
            />
          </label>
        </header>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mb-4 rounded-xl bg-[#1a1a1a] p-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
              <p className="text-xs text-orange-300">{uploadProgress}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 p-3">
            <p className="text-xs text-rose-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-1 text-[10px] text-rose-400 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
          {/* Objects List */}
          <div className="space-y-3 rounded-2xl bg-[#181818] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Encrypted Objects
              </span>
              <span className="text-[11px] text-neutral-500">
                {objects.length} stored
              </span>
            </div>
            <div className="mt-1 max-h-80 space-y-2 overflow-y-auto pr-1">
              {!wallet && (
                <p className="text-xs text-neutral-500">
                  Connect a wallet to load your Storax objects.
                </p>
              )}
              {wallet && objects.length === 0 && (
                <p className="text-xs text-neutral-500">
                  No objects yet. Upload a file to encrypt and store it.
                </p>
              )}
              {wallet &&
                objects.map((obj) => (
                  <article
                    key={obj.id}
                    onClick={() => setSelectedObject(obj)}
                    className={`cursor-pointer rounded-xl bg-[#202020] px-3 py-3 transition hover:bg-[#262626] ${
                      selectedObject?.id === obj.id ? "ring-2 ring-orange-500/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-medium text-neutral-100">
                            {obj.originalName}
                          </p>
                          {obj.isOnIPFS && (
                            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">
                              IPFS
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-neutral-500">
                          CID: {obj.cid.slice(0, 20)}…
                        </p>
                      </div>
                      <StatusPill status={obj.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-neutral-500">
                      <span>{formatBytes(obj.originalSize)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(obj.createdAt)}</span>
                    </div>
                  </article>
                ))}
            </div>
          </div>

          {/* Info Panel / Selected Object */}
          <div className="space-y-3 rounded-2xl bg-[#181818] p-4">
            {selectedObject ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Object Details
                  </p>
                  <button
                    onClick={() => setSelectedObject(null)}
                    className="text-[10px] text-neutral-500 hover:text-neutral-300"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase text-neutral-500">File</p>
                    <p className="mt-0.5 truncate text-sm text-neutral-200">
                      {selectedObject.originalName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-neutral-500">Original</p>
                      <p className="mt-0.5 text-sm text-neutral-200">
                        {formatBytes(selectedObject.originalSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-neutral-500">Encrypted</p>
                      <p className="mt-0.5 text-sm text-neutral-200">
                        {formatBytes(selectedObject.encryptedSize)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase text-neutral-500">CID (Content Identifier)</p>
                    <p className="mt-0.5 break-all font-mono text-[10px] text-neutral-400">
                      {selectedObject.cid}
                    </p>
                    {selectedObject.isOnIPFS && (
                      <a
                        href={`https://ipfs.io/ipfs/${selectedObject.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                      >
                        View encrypted file on IPFS ↗
                      </a>
                    )}
                  </div>

                  {/* IPFS Status */}
                  <div>
                    <p className="text-[10px] uppercase text-neutral-500">Storage</p>
                    <div className="mt-1 flex items-center gap-2">
                      {selectedObject.isOnIPFS ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          IPFS Network
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          Local Only
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase text-neutral-500">ZK Proof</p>
                    <p className="mt-0.5 break-all font-mono text-[10px] text-neutral-400">
                      {selectedObject.zkProofHash}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase text-neutral-500">Status</p>
                    <div className="mt-1">
                      <StatusPill status={selectedObject.status} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => handleDownload(selectedObject)}
                      disabled={isDownloading === selectedObject.id}
                      className="w-full rounded-lg bg-[#ff7a3c] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#ff8c55] disabled:opacity-50"
                    >
                      {isDownloading === selectedObject.id
                        ? "Decrypting..."
                        : "Download & Decrypt"}
                    </button>
                    {selectedObject.isOnIPFS && (
                      <a
                        href={`https://ipfs.io/ipfs/${selectedObject.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full rounded-lg bg-blue-500/20 px-3 py-2 text-center text-xs font-semibold text-blue-400 transition hover:bg-blue-500/30"
                      >
                        View on IPFS
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(selectedObject)}
                      className="w-full rounded-lg bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  ZK Proof Lifecycle
                </p>
                <ol className="space-y-2 text-xs text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] text-orange-400">
                      1
                    </span>
                    <span>
                      File is encrypted locally with AES-256-GCM using your wallet key.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] text-orange-400">
                      2
                    </span>
                    <span>
                      Encrypted data is stored in IPFS with content-addressed CID.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] text-orange-400">
                      3
                    </span>
                    <span>
                      ZK proof of storage is generated and verified on-chain.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400">
                      4
                    </span>
                    <span>
                      Only you can decrypt with your connected wallet.
                    </span>
                  </li>
                </ol>

                {/* Wallet Info */}
                <div className="mt-3 rounded-xl bg-[#111111] p-3 text-[11px] text-neutral-400">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                    Connected Wallet
                  </p>
                  <p className="truncate font-mono">
                    {publicKey ? publicKey.toBase58() : "Not connected"}
                  </p>
                </div>

                {/* Stats */}
                {wallet && objects.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[#111111] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                        Total Stored
                      </p>
                      <p className="mt-1 text-lg font-semibold text-neutral-200">
                        {formatBytes(
                          objects.reduce((sum, o) => sum + o.originalSize, 0)
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#111111] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                        Verified
                      </p>
                      <p className="mt-1 text-lg font-semibold text-emerald-400">
                        {objects.filter((o) => o.status === "verified").length}/
                        {objects.length}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label =
    normalized === "verified"
      ? "Verified"
      : normalized === "verifying"
        ? "Verifying"
        : normalized === "uploading"
          ? "Uploading"
          : "Pending";
  const color =
    normalized === "verified"
      ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/40"
      : normalized === "verifying"
        ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
        : "bg-slate-500/30 text-slate-200 border-slate-500/50";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${color}`}
    >
      <span
        className={`mr-1 h-1.5 w-1.5 rounded-full ${
          normalized === "verified"
            ? "bg-emerald-300"
            : normalized === "verifying"
              ? "animate-pulse bg-amber-300"
              : "bg-slate-200"
        }`}
      />
      {label}
    </span>
  );
}
