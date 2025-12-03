import Image from "next/image";

const blockchainLogos = [
  {
    name: "Solana",
    logo: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=040",
    alt: "Solana",
    href: "https://solana.com",
    source: "cryptologos.cc",
  },
  {
    name: "Arweave",
    logo: "https://cryptologos.cc/logos/arweave-ar-logo.svg?v=040",
    alt: "Arweave",
    href: "https://arweave.org",
    source: "cryptologos.cc",
  },
  {
    name: "Filecoin",
    logo: "https://filecoin.io/images/filecoin-logo.svg",
    alt: "Filecoin",
    href: "https://filecoin.io",
    source: "Filecoin Brand Guide",
  },
  {
    name: "Chainlink",
    logo: "https://cryptologos.cc/logos/chainlink-link-logo.svg?v=040",
    alt: "Chainlink",
    href: "https://chain.link",
    source: "cryptologos.cc",
  },
];

export function BlockchainLogos() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8379]">
        Built on:
      </span>
      {blockchainLogos.map((blockchain) => (
        <a
          href={blockchain.href}
          target="_blank"
          rel="noreferrer"
          key={blockchain.name}
          className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-1.5 shadow-sm transition-all hover:bg-white/90"
          title={`${blockchain.name} · ${blockchain.source}`}
        >
          <Image
            src={blockchain.logo}
            alt={blockchain.alt}
            width={20}
            height={20}
            className="object-contain"
          />
          <span className="text-xs font-medium text-[#2c2c2c]">
            {blockchain.name}
          </span>
        </a>
      ))}
    </div>
  );
}

