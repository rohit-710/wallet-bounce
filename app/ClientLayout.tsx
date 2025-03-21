'use client';

import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { solanaDevnet } from "@reown/appkit/networks";
import React from "react";

// Initialize Reown AppKit
const solanaAdapter = new SolanaAdapter({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ] as any
});

export const modal = createAppKit({
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "",
  metadata: {
    name: "Wallet Bounce",
    description: "A simple ball bouncing game powered by Solana and Reown AppKit",
    url: "https://breakwallet.app",
    icons: ["https://breakwallet.app/icon.png"]
  },
  themeMode: "light",
  networks: [solanaDevnet],
  adapters: [solanaAdapter],
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50">
      <appkit-button />
      {children}
    </div>
  );
} 