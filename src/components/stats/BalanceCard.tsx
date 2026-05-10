"use client";

import { useEffect, useState } from "react";
import { Wallet, ChevronDown } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/wallet/${address}/balance`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  const ethAmount = data ? Number(BigInt(data.ethBalance)) / 1e18 : 0;
  const hasContent = ethAmount > 0 || (data?.tokens.length ?? 0) > 0;
  const rowCount = 1 + (data?.tokens.length ?? 0); // ETH + tokens

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Always-visible header — click to toggle */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((o) => !o)}
        disabled={loading || !hasContent}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
            <Wallet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-sm font-medium">Wallet Balance</span>
          {!loading && hasContent && (
            <span className="text-xs text-muted-foreground">
              {rowCount} asset{rowCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          ) : data && data.totalUsd > 0 ? (
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {formatUsd(data.totalUsd)} total
            </span>
          ) : data ? (
            <span className="text-sm text-muted-foreground">No value</span>
          ) : null}

          {!loading && hasContent && (
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </button>

      {/* Collapsible body */}
      {open && data && (
        <div className="border-t divide-y">
          {/* ETH row */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xl leading-none">⟠</span>
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
            <div key={token.address} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {token.symbol.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatAmount(token.amount, token.symbol)}</p>
                {token.usdValue !== null && token.usdValue > 0 ? (
                  <p className="text-xs text-muted-foreground">{formatUsd(token.usdValue)}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">No price data</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
