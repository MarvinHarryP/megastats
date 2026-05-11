"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { DeFiPosition } from "@/app/api/wallet/[address]/defi/route";
import type { V3Position } from "@/app/api/wallet/[address]/v3positions/route";
import { PROTOCOL_COLORS, PROTOCOL_LOGOS } from "@/lib/defi-registry";

interface Props {
  address: string;
}

// Unified position row for rendering
interface UnifiedPosition {
  key: string;
  label: string;       // e.g. "WETH/USDm LP" or "GLV Vault"
  sublabel?: string;   // e.g. "0.3% · In Range" or "gUSDM"
  amount?: string;
  usdValue: number | null;
  badge?: { text: string; green: boolean };
}

interface ProtocolGroup {
  protocol: string;
  icon: string;
  color: string;
  url?: string;
  positions: UnifiedPosition[];
  totalUsd: number;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(2) + "M";
  if (value >= 1_000) return "$" + (value / 1_000).toFixed(2) + "K";
  return "$" + value.toFixed(2);
}

function formatAmount(amount: number, symbol: string): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(2) + "M " + symbol;
  if (amount >= 1_000) return (amount / 1_000).toFixed(2) + "K " + symbol;
  if (amount < 0.0001 && amount > 0) return "< 0.0001 " + symbol;
  return amount.toFixed(4) + " " + symbol;
}

function ProtocolIcon({ protocol, icon, color }: { protocol: string; icon: string; color: string }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = PROTOCOL_LOGOS[protocol];
  const bg = PROTOCOL_COLORS[color] ?? PROTOCOL_COLORS.gray;

  if (logoUrl && !imgError) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border/50 bg-muted flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={protocol}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0 text-lg shadow-sm`}>
      {icon}
    </div>
  );
}

function ProtocolRow({ group }: { group: ProtocolGroup }) {
  const [open, setOpen] = useState(false);
  const count = group.positions.length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <ProtocolIcon protocol={group.protocol} icon={group.icon} color={group.color} />

        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm">{group.protocol}</p>
          <p className="text-xs text-muted-foreground">
            {count === 1 ? "1 position" : `${count} positions`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-primary">
            {group.totalUsd > 0 ? formatUsd(group.totalUsd) : "$0.00"}
          </span>
          {group.url && (
            <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t divide-y divide-border/50">
          {group.positions.map((pos) => (
            <div
              key={pos.key}
              className="flex items-center justify-between px-4 py-2.5 bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{pos.label}</p>
                  {pos.badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      pos.badge.green
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {pos.badge.text}
                    </span>
                  )}
                </div>
                {pos.sublabel && (
                  <p className="text-xs text-muted-foreground">{pos.sublabel}</p>
                )}
                {pos.amount && (
                  <p className="text-xs text-muted-foreground font-mono">{pos.amount}</p>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                {pos.usdValue !== null && pos.usdValue > 0 && (
                  <p className="text-sm font-semibold text-primary tabular-nums">
                    {formatUsd(pos.usdValue)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Convert token-based DeFiPosition to UnifiedPosition
function defiToUnified(p: DeFiPosition): UnifiedPosition {
  return {
    key: `token-${p.address}`,
    label: p.type,
    sublabel: p.symbol,
    amount: p.amount > 0 ? formatAmount(p.amount, p.symbol) : undefined,
    usdValue: p.usdValue,
  };
}

// Convert V3Position to UnifiedPosition
function v3ToUnified(p: V3Position): UnifiedPosition {
  const feePercent = (p.fee / 10000).toFixed(2).replace(/\.?0+$/, "") + "%";
  const pair = `${p.token0Symbol}/${p.token1Symbol}`;

  let amountParts: string[] = [];
  if (p.amount0 > 0.00001) amountParts.push(formatAmount(p.amount0, p.token0Symbol));
  if (p.amount1 > 0.00001) amountParts.push(formatAmount(p.amount1, p.token1Symbol));

  return {
    key: `v3-${p.tokenId}`,
    label: `${pair} ${feePercent}`,
    sublabel: amountParts.join(" + ") || undefined,
    usdValue: p.usdValue,
    badge: { text: p.inRange ? "In Range" : "Out of Range", green: p.inRange },
  };
}

export function DeFiPositions({ address }: Props) {
  const [groups, setGroups] = useState<ProtocolGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsd, setTotalUsd] = useState(0);

  useEffect(() => {
    // Fetch with abort timeout so a hanging RPC never blocks the UI
    function fetchWithTimeout(url: string, ms: number) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      return fetch(url, { signal: ctrl.signal })
        .then((r) => r.json())
        .finally(() => clearTimeout(t));
    }

    // Fetch both token-based and V3 LP positions in parallel
    Promise.allSettled([
      fetchWithTimeout(`/api/wallet/${address}/defi`, 10_000),
      fetchWithTimeout(`/api/wallet/${address}/v3positions`, 15_000),
    ]).then(([defiResult, v3Result]) => {
      const map = new Map<string, ProtocolGroup>();

      // Add token-based DeFi positions
      if (defiResult.status === "fulfilled") {
        const positions: DeFiPosition[] = defiResult.value.positions ?? [];
        for (const p of positions) {
          if (!map.has(p.protocol)) {
            map.set(p.protocol, {
              protocol: p.protocol, icon: p.icon, color: p.color ?? "gray",
              url: p.url, positions: [], totalUsd: 0,
            });
          }
          const g = map.get(p.protocol)!;
          g.positions.push(defiToUnified(p));
          g.totalUsd += p.usdValue ?? 0;
        }
      }

      // Add V3 LP positions
      if (v3Result.status === "fulfilled") {
        const v3Positions: V3Position[] = v3Result.value.positions ?? [];
        for (const p of v3Positions) {
          if (!map.has(p.protocol)) {
            map.set(p.protocol, {
              protocol: p.protocol, icon: p.icon, color: p.color,
              url: p.url, positions: [], totalUsd: 0,
            });
          }
          const g = map.get(p.protocol)!;
          g.positions.push(v3ToUnified(p));
          g.totalUsd += p.usdValue ?? 0;
        }
      }

      const sorted = Array.from(map.values()).sort((a, b) => b.totalUsd - a.totalUsd);
      setGroups(sorted);
      setTotalUsd(sorted.reduce((s, g) => s + g.totalUsd, 0));
      setLoading(false);
    });
  }, [address]);

  if (loading || groups.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ⚡ DeFi Positions
        </p>
        {totalUsd > 0 && (
          <p className="text-xs font-semibold text-primary">{formatUsd(totalUsd)} total</p>
        )}
      </div>
      {groups.map((group) => (
        <ProtocolRow key={group.protocol} group={group} />
      ))}
    </div>
  );
}
