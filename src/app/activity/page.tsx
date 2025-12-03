"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import {
  getActivityEvents,
  formatRelativeTime,
  type ActivityEvent,
} from "@/lib/storage";

export default function ActivityPage() {
  const { publicKey } = useWallet();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const wallet = publicKey?.toBase58();

  useEffect(() => {
    if (wallet) {
      setEvents(getActivityEvents(wallet));
    } else {
      setEvents([]);
    }
  }, [wallet]);

  const filteredEvents =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <div className="flex min-h-screen flex-col bg-[#f1e9dd] text-[#1b1712]">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-[#ded3c4] bg-[#f4ede3]">
          <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8379]">
              Activity Log
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#201b16]">
                  Your Storage Activity
                </h1>
                <p className="mt-1 text-xs text-[#8a8379]">
                  Track all uploads, verifications, and changes to your
                  encrypted storage.
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
                <ActivityIcon className="h-8 w-8 text-[#8a8379]" />
              </div>
              <h2 className="text-lg font-semibold text-[#201b16]">
                Connect Your Wallet
              </h2>
              <p className="mt-2 text-sm text-[#8a8379]">
                Connect a Solana wallet to view your activity history.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All Activity" },
                  { value: "upload", label: "Uploads" },
                  { value: "verify", label: "Verifications" },
                  { value: "download", label: "Downloads" },
                  { value: "settings_change", label: "Settings" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                      filter === f.value
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-[#e8e0d4] text-[#6b6560] hover:bg-[#ddd5c9]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Activity List */}
              <div className="rounded-3xl bg-[#faf4ec] p-6">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[#8a8379]">
                      {filter === "all"
                        ? "No activity yet. Upload a file to get started."
                        : `No ${filter} activity found.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEvents.map((event) => (
                      <ActivityItem key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              {events.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-4">
                  <StatCard
                    label="Total Events"
                    value={events.length}
                    icon={<ActivityIcon className="h-5 w-5" />}
                  />
                  <StatCard
                    label="Uploads"
                    value={events.filter((e) => e.type === "upload").length}
                    icon={<UploadIcon className="h-5 w-5" />}
                  />
                  <StatCard
                    label="Verified"
                    value={events.filter((e) => e.type === "verify").length}
                    icon={<VerifyIcon className="h-5 w-5" />}
                  />
                  <StatCard
                    label="Downloads"
                    value={events.filter((e) => e.type === "download").length}
                    icon={<DownloadIcon className="h-5 w-5" />}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const getIcon = () => {
    switch (event.type) {
      case "upload":
        return <UploadIcon className="h-4 w-4 text-blue-500" />;
      case "verify":
        return <VerifyIcon className="h-4 w-4 text-emerald-500" />;
      case "download":
        return <DownloadIcon className="h-4 w-4 text-purple-500" />;
      case "delete":
        return <DeleteIcon className="h-4 w-4 text-red-500" />;
      case "settings_change":
        return <SettingsIcon className="h-4 w-4 text-amber-500" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (event.type) {
      case "upload":
        return "Uploaded";
      case "verify":
        return "Verified";
      case "download":
        return "Downloaded";
      case "delete":
        return "Deleted";
      case "settings_change":
        return "Settings Changed";
      default:
        return event.type;
    }
  };

  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white/60 p-4 transition hover:bg-white/80">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4ede3]">
        {getIcon()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#e8e0d4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6b6560]">
            {getTypeLabel()}
          </span>
          <span className="text-[11px] text-[#8a8379]">
            {formatRelativeTime(event.timestamp)}
          </span>
        </div>
        <p className="mt-1 text-sm text-[#201b16]">{event.description}</p>
        {event.fileName && (
          <p className="mt-0.5 truncate font-mono text-xs text-[#8a8379]">
            {event.fileName}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#faf4ec] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e0d4] text-[#6b6560]">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold text-[#201b16]">{value}</p>
          <p className="text-[11px] text-[#8a8379]">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Icons
function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function VerifyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

