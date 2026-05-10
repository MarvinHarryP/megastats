"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { formatAddress } from "@/lib/utils";

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${address.toLowerCase()}`)}
          className="font-mono text-xs"
        >
          {formatAddress(address)}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => disconnect()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const injectedConnector = connectors.find((c) => c.id === "injected");

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      Connect
    </Button>
  );
}
