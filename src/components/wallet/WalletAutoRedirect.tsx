"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export function WalletAutoRedirect() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isConnected && address && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push(`/${address.toLowerCase()}`);
    }
    if (!isConnected) {
      hasRedirected.current = false;
    }
  }, [isConnected, address, router]);

  return null;
}
