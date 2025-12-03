"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by rendering a placeholder until client-side
  if (!mounted) {
    return (
      <div className="wallet-adapter-button-trigger text-xs">
        <button
          className="wallet-adapter-button wallet-adapter-button-trigger"
          style={{ pointerEvents: "none" }}
        >
          Select Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-adapter-button-trigger text-xs">
      <WalletMultiButton />
    </div>
  );
}


