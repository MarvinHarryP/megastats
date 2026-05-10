"use client";

import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";

export const megaeth = defineChain({
  id: 6342,
  name: "MegaETH",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.megaeth.com/rpc"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://megaeth.blockscout.com" },
  },
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const wagmiConfig = createConfig({
  chains: [megaeth],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [megaeth.id]: http("https://mainnet.megaeth.com/rpc"),
  },
  ssr: true,
});
