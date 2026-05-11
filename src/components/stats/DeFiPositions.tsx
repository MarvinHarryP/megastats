"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { DeFiPosition } from "@/app/api/wallet/[address]/defi/route";
import { PROTOCOL_COLORS } from "@/lib/defi-registry";

interface Props {
  address: string;
}

interface ProtocolGroup {
  protocol: string;
  icon: string;
  color: string;
  url?: string;
  positions: DeFiPosition[];
  totalUsd: number;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(2) + "M";
  if (value >= 1_000) return "$" + (value / 1_000).toFixed(2) + "K";
  return "$" + value.toFixed(2);
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(2) + "M";
  if (amount >= 1_000) return (amount / 1_000).toFixed(2) + "K";
  if (amount < 0.0001) return "< 0.0001";
  return amount.toFixed(4);
}

function positionLabel(count: number): string {
  return count === 1 ? "1 position" : `${count} positions`;
}

function ProtocolIcon({ icon, color }: { icon: string; color: string }) {
  const bg = PROTOCOL_COLORS[color] ?? PROTOCOL_COLORS.gray;
  return (
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0 text-lg shadow-sm`}>
      {icon}
    </div>
  );
}

function ProtocolRow({ group }: { group: ProtocolGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <ProtocolIcon icon={group.icon} color={group.color} />

        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm">{group.protocol}</p>
          <p className="text-xs text-muted-foreground">{positionLabel(group.positions.length)}</p>
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
              key={pos.address}
              className="flex items-center justify-between px-4 py-2.5 bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{pos.type}</p>
                <p className="text-xs text-muted-foreground truncate font-mono">{pos.symbol}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm tabular-nums text-muted-foreground">{formatAmount(pos.amount)}</p>
                {pos.usdValue !== null && pos.usdValue > 0 && (
                  <p className="text-xs font-medium text-primary tabular-nums">{formatUsd(pos.usdValue)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeFiPositions({ address }: Props) {
  const [groups, setGroups] = useState<ProtocolGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsd, setTotalUsd] = useState(0);

  useEffect(() => {
    fetch(`/api/wallet/${address}/defi`)
      .then((r) => r.json())
      .then((data) => {
        const positions: DeFiPosition[] = data.positions ?? [];

        // Group by protocol
        const map = new Map<string, ProtocolGroup>();
        for (const p of positions) {
          if (!map.has(p.protocol)) {
            map.set(p.protocol, {
              protocol: p.protocol,
              icon: p.icon,
              color: p.color ?? "gray",
              url: p.url,
              positions: [],
              totalUsd: 0,
            });
          }
          const g = map.get(p.protocol)!;
          g.positions.push(p);
          g.totalUsd += p.usdValue ?? 0;
        }

        const sorted = Array.from(map.values()).sort((a, b) => b.totalUsd - a.totalUsd);
        setGroups(sorted);
        setTotalUsd(sorted.reduce((s, g) => s + g.totalUsd, 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [address]);

  if (loading || groups.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ⚡ DeFi Positions
        </p>
        {totalUsd > 0 && (
          <p className="text-xs font-semibold text-primary">{formatUsd(totalUsd)} total</p>
        )}
      </div>

      {/* One card per protocol */}
      {groups.map((group) => (
        <ProtocolRow key={group.protocol} group={group} />
      ))}
    </div>
  );
}
