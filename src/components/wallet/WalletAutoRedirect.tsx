"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export function WalletAutoRedirect() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) {
      router.push(`/${address.toLowerCase()}`);
    }
  }, [isConnected, address, router]);

  return null;
}
