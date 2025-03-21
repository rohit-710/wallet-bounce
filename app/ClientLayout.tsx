'use client';

import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solanaDevnet } from "@reown/appkit/networks";
import React from "react";

// Initialize Reown AppKit
const solanaAdapter = new SolanaAdapter({
});

export const modal = createAppKit({
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "",
  metadata: {
    name: "Wallet Bounce",
    description: "A simple ball bouncing game powered by Solana and Reown AppKit",
    url: "https://wallet-bounce.vercel.app/",
    icons: ["https://avatars.githubusercontent.com/u/179229932"]
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