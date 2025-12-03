"use client";

import { StorageDashboard } from "@/components/storage/StorageDashboard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { BlockchainLogos } from "@/components/blockchain/BlockchainLogos";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f1e9dd] text-[#1b1712]">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-[#ded3c4] bg-[#f4ede3]">
          <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8379]">
              Latest state
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#201b16]">
                  Zero-knowledge storage dashboard
                </h1>
                <p className="mt-1 text-xs text-[#8a8379]">
                  Connect a Solana wallet, upload encrypted objects, and follow
                  their proof-of-storage lifecycle.
                </p>
              </div>
              <ConnectWallet />
            </div>
            <div className="mt-6">
              <BlockchainLogos />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
            <div className="rounded-3xl bg-[#faf4ec] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8379]">
                Your encrypted objects
              </p>
              <StorageDashboard />
            </div>
            <div className="space-y-4 rounded-3xl bg-[#faf4ec] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8379]">
                Protocol insights
              </p>
              <article className="rounded-2xl bg-[#151515] p-4 text-sm text-[#f5f5f5]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-[#262626] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5f5f5]">
                    Technology
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    ZK proofs · Solana · IPFS
                  </span>
                </div>
                <h2 className="text-lg font-semibold">
                  How Storax protects your data
                </h2>
                <p className="mt-2 text-xs text-neutral-300">
                  Storax encrypts your files client-side using AES-256-GCM with 
                  wallet-derived keys, uploads them to IPFS, and verifies storage
                  with zero-knowledge proofs on Solana.
                </p>
              </article>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
