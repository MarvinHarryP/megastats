"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter, usePathname } from "next/navigation";

export function WalletAutoRedirect() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isConnected && address && pathname === "/") {
      router.push(`/${address.toLowerCase()}`);
    }
  }, [isConnected, address, pathname, router]);

  return null;
}
