"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { DeFiPosition } from "@/app/api/wallet/[address]/defi/route";

interface Props {
  address: string;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(2) + "M";
  if (amount >= 1_000) return (amount / 1_000).toFixed(2) + "K";
  if (amount < 0.0001) return "< 0.0001";
  return amount.toFixed(4);
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(2) + "M";
  if (value >= 1_000) return "$" + (value / 1_000).toFixed(2) + "K";
  return "$" + value.toFixed(2);
}

// Group positions by protocol
function groupByProtocol(positions: DeFiPosition[]): Record<string, DeFiPosition[]> {
  const groups: Record<string, DeFiPosition[]> = {};
  for (const p of positions) {
    if (!groups[p.protocol]) groups[p.protocol] = [];
    groups[p.protocol].push(p);
  }
  return groups;
}

export function DeFiPositions({ address }: Props) {
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetch(`/api/wallet/${address}/defi`)
      .then((r) => r.json())
      .then((data) => {
        setPositions(data.positions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [address]);

  if (loading || positions.length === 0) return null;

  const groups = groupByProtocol(positions);
  const totalUsd = positions.reduce((sum, p) => sum + (p.usdValue ?? 0), 0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="font-semibold text-sm">DeFi Positions</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {positions.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {totalUsd > 0 && (
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatUsd(totalUsd)}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Content */}
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {Object.entries(groups).map(([protocol, proPos]) => {
            const protocolUsd = proPos.reduce((sum, p) => sum + (p.usdValue ?? 0), 0);
            const icon = proPos[0].icon;
            const url = proPos[0].url;

            return (
              <div key={protocol} className="space-y-2">
                {/* Protocol header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-sm font-semibold">{protocol}</span>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {protocolUsd > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatUsd(protocolUsd)}
                    </span>
                  )}
                </div>

                {/* Position rows */}
                <div className="rounded-lg border divide-y divide-border overflow-hidden">
                  {proPos.map((pos) => (
                    <div
                      key={pos.address}
                      className="flex items-center justify-between px-3 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{pos.symbol}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {pos.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{pos.name}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-medium tabular-nums">
                          {formatAmount(pos.amount)}
                        </p>
                        {pos.usdValue !== null && pos.usdValue > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400 tabular-nums">
                            {formatUsd(pos.usdValue)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
