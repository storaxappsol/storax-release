import { BlockchainLogos } from "@/components/blockchain/BlockchainLogos";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#ded3c4] bg-[#f2e9dd]">
      <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10">
        <div className="mb-4">
          <BlockchainLogos />
        </div>
        <div className="flex flex-col gap-4 text-[11px] text-[#8a8379] lg:flex-row lg:items-center lg:justify-between">
          <span>© {new Date().getFullYear()} Storax. All rights reserved.</span>
          <span>Zero-knowledge storage powered by Solana.</span>
        </div>
      </div>
    </footer>
  );
}


