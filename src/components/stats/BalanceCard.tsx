"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import type { BalanceResponse } from "@/app/api/wallet/[address]/balance/route";

interface Props {
  address: string;
}

function formatAmount(amount: number, symbol: string): string {
  if (amount === 0) return `0 ${symbol}`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M ${symbol}`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K ${symbol}`;
  if (amount >= 1) return `${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${symbol}`;
  if (amount >= 0.0001) return `${amount.toFixed(6)} ${symbol}`;
  return `<0.0001 ${symbol}`;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (value >= 0.01) return `$${value.toFixed(2)}`;
  return "<$0.01";
}

export function BalanceCard({ address }: Props) {
  const [data, setData] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wallet/${address}/balance`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  const ethAmount = data ? Number(BigInt(data.ethBalance)) / 1e18 : 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
            <Wallet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>
        {!loading && data && data.totalUsd > 0 && (
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {formatUsd(data.totalUsd)} total
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Failed to load balance.</p>
      ) : (
        <div className="space-y-1">
          {/* ETH row */}
          <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-base">⟠</span>
              <div>
                <p className="text-sm font-medium">ETH</p>
                <p className="text-xs text-muted-foreground">Ether</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatAmount(ethAmount, "ETH")}</p>
              {data.ethUsd > 0 && (
                <p className="text-xs text-muted-foreground">{formatUsd(data.ethUsd)}</p>
              )}
            </div>
          </div>

          {/* Token rows */}
          {data.tokens.map((token) => (
            <div
              key={token.address}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {token.symbol.slice(0, 2)}
                </span>
                <div>
                  <p className="text-sm font-medium">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatAmount(token.amount, token.symbol)}</p>
                {token.usdValue !== null && token.usdValue > 0 ? (
                  <p className="text-xs text-muted-foreground">{formatUsd(token.usdValue)}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">No price</p>
                )}
              </div>
            </div>
          ))}

          {data.tokens.length === 0 && ethAmount === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No balance found</p>
          )}
        </div>
      )}
    </div>
  );
}
