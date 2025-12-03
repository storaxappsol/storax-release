import Image from "next/image";
import Link from "next/link";
import { Navigation } from "./Navigation";

export function SiteHeader() {
  return (
    <header className="border-b border-[#ded3c4] bg-[#f7f1e7]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full shadow-md">
            <Image
              src="/logo.png"
              alt="Storax Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-[0.08em] text-[#181818]">
              STORAX
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#8a8379]">
              ZK STORAGE ON SOLANA
            </span>
          </div>
        </Link>

        <div className="hidden sm:block">
          <Navigation />
        </div>
      </div>
    </header>
  );
}


