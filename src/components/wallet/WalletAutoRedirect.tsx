"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export function WalletAutoRedirect() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) {
      const key = `wallet_redirected_${address.toLowerCase()}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        router.push(`/${address.toLowerCase()}`);
      }
    }
  }, [isConnected, address, router]);

  return null;
}
