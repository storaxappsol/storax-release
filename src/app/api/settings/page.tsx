"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import {
  getUserSettings,
  saveUserSettings,
  addActivityEvent,
  type UserSettings,
} from "@/lib/storage";
import { isIPFSEnabled } from "@/lib/ipfs";

export default function SettingsPage() {
  const { publicKey } = useWallet();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [ipfsEnabled, setIpfsEnabled] = useState(false);

  const wallet = publicKey?.toBase58();

  useEffect(() => {
    if (wallet) {
      setSettings(getUserSettings(wallet));
    } else {
      setSettings(null);
    }
    // Check if IPFS is enabled (configured by developer)
    setIpfsEnabled(isIPFSEnabled());
  }, [wallet]);

  const handleChange = (key: keyof UserSettings, value: UserSettings[keyof UserSettings]) => {
    if (!settings || !wallet) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveUserSettings(wallet, updated);
    addActivityEvent(wallet, {
      type: "settings_change",
      description: `Changed ${key} setting`,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f1e9dd] text-[#1b1712]">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-[#ded3c4] bg-[#f4ede3]">
          <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8379]">
              Configuration
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#201b16]">
                  Settings
                </h1>
                <p className="mt-1 text-xs text-[#8a8379]">
                  Customize your Storax experience. Settings are saved per
                  wallet.
                </p>
              </div>
              <ConnectWallet />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
          {!wallet ? (
            <div className="rounded-3xl bg-[#faf4ec] p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8e0d4]">
                <SettingsIcon className="h-8 w-8 text-[#8a8379]" />
              </div>
              <h2 className="text-lg font-semibold text-[#201b16]">
                Connect Your Wallet
              </h2>
              <p className="mt-2 text-sm text-[#8a8379]">
                Connect a Solana wallet to access your personalized settings.
              </p>
            </div>
          ) : settings ? (
            <div className="space-y-6">
              {/* Save indicator */}
              {saved && (
                <div className="fixed right-6 top-24 z-50 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
                  ✓ Settings saved
                </div>
              )}

              {/* IPFS Storage Status Section */}
              <section className="rounded-3xl bg-[#faf4ec] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8a8379]">
                    Decentralized Storage
                  </h2>
                  {ipfsEnabled ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                      IPFS Enabled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Local Storage
                    </span>
                  )}
                </div>
                
                {ipfsEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <IPFSIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-800">
                          IPFS Network Connected
                        </p>
                        <p className="mt-1 text-xs text-emerald-600">
                          Your encrypted files are uploaded to the InterPlanetary File System (IPFS) 
                          and accessible worldwide via public gateways.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white/60 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#8a8379]">Network</p>
                        <p className="mt-1 text-sm font-medium text-[#201b16]">IPFS</p>
                      </div>
                      <div className="rounded-xl bg-white/60 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#8a8379]">Availability</p>
                        <p className="mt-1 text-sm font-medium text-[#201b16]">Global</p>
                      </div>
                      <div className="rounded-xl bg-white/60 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#8a8379]">Encryption</p>
                        <p className="mt-1 text-sm font-medium text-[#201b16]">AES-256-GCM</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                        <LocalIcon className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-800">
                          Local Storage Mode
                        </p>
                        <p className="mt-1 text-xs text-amber-600">
                          Files are encrypted and stored locally in your browser. 
                          They are only accessible on this device.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#8a8379]">
                      Contact the administrator to enable IPFS for global file accessibility.
                    </p>
                  </div>
                )}
              </section>

              {/* Profile Section */}
              <section className="rounded-3xl bg-[#faf4ec] p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8a8379]">
                  Profile
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#6b6560]">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.displayName}
                      onChange={(e) =>
                        handleChange("displayName", e.target.value)
                      }
                      placeholder="Anonymous"
                      className="w-full max-w-md rounded-xl border border-[#ded3c4] bg-white px-4 py-3 text-sm text-[#201b16] placeholder-[#b5ada3] outline-none focus:border-[#ff7a3c] focus:ring-2 focus:ring-[#ff7a3c]/20"
                    />
                    <p className="mt-1 text-[11px] text-[#8a8379]">
                      Optional name shown in the dashboard
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#6b6560]">
                      Wallet Address
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="rounded-lg bg-[#e8e0d4] px-3 py-2 font-mono text-xs text-[#6b6560]">
                        {wallet}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(wallet)}
                        className="rounded-lg bg-[#e8e0d4] p-2 text-[#6b6560] transition hover:bg-[#ddd5c9]"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Storage Defaults */}
              <section className="rounded-3xl bg-[#faf4ec] p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8a8379]">
                  Storage Defaults
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#6b6560]">
                      Default Redundancy
                    </label>
                    <select
                      value={settings.defaultRedundancy}
                      onChange={(e) =>
                        handleChange("defaultRedundancy", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-[#ded3c4] bg-white px-4 py-3 text-sm text-[#201b16] outline-none focus:border-[#ff7a3c]"
                    >
                      <option value={1}>1x (Minimum)</option>
                      <option value={3}>3x (Standard)</option>
                      <option value={5}>5x (High)</option>
                      <option value={10}>10x (Maximum)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-[#8a8379]">
                      Number of storage node copies
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#6b6560]">
                      Default Shard Count
                    </label>
                    <select
                      value={settings.defaultShardCount}
                      onChange={(e) =>
                        handleChange("defaultShardCount", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-[#ded3c4] bg-white px-4 py-3 text-sm text-[#201b16] outline-none focus:border-[#ff7a3c]"
                    >
                      <option value={8}>8 shards</option>
                      <option value={16}>16 shards</option>
                      <option value={32}>32 shards (Standard)</option>
                      <option value={64}>64 shards</option>
                    </select>
                    <p className="mt-1 text-[11px] text-[#8a8379]">
                      How many pieces to split files into
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#6b6560]">
                      Preferred Storage
                    </label>
                    <select
                      value={settings.preferredStorage}
                      onChange={(e) =>
                        handleChange(
                          "preferredStorage",
                          e.target.value as "arweave" | "ipfs" | "both"
                        )
                      }
                      className="w-full rounded-xl border border-[#ded3c4] bg-white px-4 py-3 text-sm text-[#201b16] outline-none focus:border-[#ff7a3c]"
                    >
                      <option value="both">Arweave + IPFS (Recommended)</option>
                      <option value="arweave">Arweave Only</option>
                      <option value="ipfs">IPFS Only</option>
                    </select>
                    <p className="mt-1 text-[11px] text-[#8a8379]">
                      Where to store encrypted data
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#6b6560]">
                      Encryption Strength
                    </label>
                    <select
                      value={settings.encryptionStrength}
                      onChange={(e) =>
                        handleChange(
                          "encryptionStrength",
                          e.target.value as "standard" | "high"
                        )
                      }
                      className="w-full rounded-xl border border-[#ded3c4] bg-white px-4 py-3 text-sm text-[#201b16] outline-none focus:border-[#ff7a3c]"
                    >
                      <option value="standard">AES-256-GCM (Standard)</option>
                      <option value="high">
                        AES-256-GCM + ChaCha20 (High)
                      </option>
                    </select>
                    <p className="mt-1 text-[11px] text-[#8a8379]">
                      Encryption algorithm for your files
                    </p>
                  </div>
                </div>
              </section>

              {/* Preferences */}
              <section className="rounded-3xl bg-[#faf4ec] p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8a8379]">
                  Preferences
                </h2>
                <div className="space-y-4">
                  <ToggleSetting
                    label="Auto-verify uploads"
                    description="Automatically verify files after upload completes"
                    checked={settings.autoVerify}
                    onChange={(v) => handleChange("autoVerify", v)}
                  />
                  <ToggleSetting
                    label="Notifications"
                    description="Show browser notifications for upload and verification events"
                    checked={settings.notifications}
                    onChange={(v) => handleChange("notifications", v)}
                  />
                </div>
              </section>

              {/* Theme */}
              <section className="rounded-3xl bg-[#faf4ec] p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8a8379]">
                  Appearance
                </h2>
                <div className="flex gap-3">
                  {(["light", "dark", "system"] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleChange("theme", theme)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        settings.theme === theme
                          ? "bg-[#1a1a1a] text-white"
                          : "bg-[#e8e0d4] text-[#6b6560] hover:bg-[#ddd5c9]"
                      }`}
                    >
                      {theme === "light" && <SunIcon className="h-4 w-4" />}
                      {theme === "dark" && <MoonIcon className="h-4 w-4" />}
                      {theme === "system" && <MonitorIcon className="h-4 w-4" />}
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </section>

              {/* Danger Zone */}
              <section className="rounded-3xl border border-red-200 bg-red-50/50 p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-600">
                  Danger Zone
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#201b16]">
                      Clear All Data
                    </p>
                    <p className="text-xs text-[#8a8379]">
                      Remove all stored objects and activity history for this
                      wallet
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure? This will delete all your stored data."
                        )
                      ) {
                        localStorage.removeItem(`storax_objects_${wallet}`);
                        localStorage.removeItem(`storax_activity_${wallet}`);
                        localStorage.removeItem(`storax_settings_${wallet}`);
                        window.location.reload();
                      }
                    }}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                  >
                    Clear Data
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#201b16]">{label}</p>
        <p className="text-xs text-[#8a8379]">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-[#ff7a3c]" : "bg-[#d5cdc1]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

// Icons
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function IPFSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm-1.073 1.445h.001a1.8 1.8 0 0 1 2.138 0l7.534 4.35a1.794 1.794 0 0 1 .9 1.556v8.65a1.794 1.794 0 0 1-.9 1.556l-7.534 4.35a1.8 1.8 0 0 1-2.138 0l-7.534-4.35a1.794 1.794 0 0 1-.9-1.556v-8.65c0-.642.342-1.234.9-1.556l7.533-4.35z" />
    </svg>
  );
}

function LocalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M12 12h.01" />
      <path d="M17 12h.01" />
      <path d="M7 12h.01" />
    </svg>
  );
}

