"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Plus, Check } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { WhaleTx } from "@/app/api/whales/feed/route";

const MIN_OPTIONS = [
  { label: "> $1K", value: 1_000 },
  { label: "> $10K", value: 10_000 },
  { label: "> $100K", value: 100_000 },
];

function formatUsd(v: number) {
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(1) + "K";
  return "$" + v.toFixed(0);
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function TimeAgo({ timestamp }: { timestamp: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const update = () =>
      setLabel(formatDistanceToNow(new Date(timestamp), { addSuffix: true }));
    update();
    const t = setInterval(update, 10_000);
    return () => clearInterval(t);
  }, [timestamp]);
  return <span className="text-xs text-muted-foreground tabular-nums">{label}</span>;
}

function TrackButton({ address }: { address: string }) {
  const { isTracked, add } = useWatchlist();
  const tracked = isTracked(address);
  return (
    <button
      onClick={() => add(address)}
      disabled={tracked}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors shrink-0 ${
        tracked
          ? "border-green-500/40 text-green-500 bg-green-500/10 cursor-default"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {tracked ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      {tracked ? "Tracked" : "Track"}
    </button>
  );
}

const CACHE_KEY = "megastats_whales_feed";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function loadCached(): WhaleTx[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const { txs, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_TTL_MS) return [];
    return txs ?? [];
  } catch { return []; }
}

function saveCached(txs: WhaleTx[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ txs, savedAt: Date.now() }));
  } catch {}
}

export default function WhalesPage() {
  const [txs, setTxs] = useState<WhaleTx[]>([]);
  const [min, setMin] = useState(1_000);
  const initialLoad = useRef(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const seenHashes = useRef(new Set<string>());

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`/api/whales/feed?min=${min}`);
      const data = await res.json();
      const incoming: WhaleTx[] = data.txs ?? [];

      setTxs((prev) => {
        const prevMap = new Map(prev.map((t) => [t.hash, t]));
        const merged: WhaleTx[] = [];
        // Add new ones first
        for (const tx of incoming) {
          if (!seenHashes.current.has(tx.hash)) {
            seenHashes.current.add(tx.hash);
          }
          merged.push(tx);
        }
        // Keep previously seen that aren't in new batch (may have scrolled off)
        for (const tx of prev) {
          if (!merged.find((t) => t.hash === tx.hash)) {
            merged.push(tx);
          }
        }
        const sorted = merged.sort((a, b) => b.usdValue - a.usdValue).slice(0, 50);
        saveCached(sorted);
        return sorted;
      });
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
  }, [min]);

  useEffect(() => {
    seenHashes.current.clear();
    if (initialLoad.current) {
      // Restore cache on first mount so page feels instant
      const cached = loadCached();
      setTxs(cached);
      setLoading(cached.length === 0);
      initialLoad.current = false;
    } else {
      // Filter changed — clear and reload fresh
      setTxs([]);
      setLoading(true);
    }
    fetchFeed();
    const interval = setInterval(fetchFeed, 5_000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🐋 Whale Watcher
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Größte Transaktionen auf MegaETH — live
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          {lastUpdate && (
            <span>· aktualisiert {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
          )}
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {MIN_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMin(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              min === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">🌊</p>
          <p className="font-medium">Keine Transaktionen über {formatUsd(min)} gefunden</p>
          <p className="text-sm mt-1">Versuche einen niedrigeren Filter</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {txs.map((tx) => {
            const mainTransfer = tx.tokenTransfers[0];
            const label = tx.method
              ? tx.method.replace(/_/g, " ")
              : mainTransfer
              ? `${mainTransfer.symbol} Transfer`
              : tx.ethValue > 0
              ? "ETH Transfer"
              : "Contract Call";

            return (
              <div
                key={tx.hash}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
              >
                {/* Wallet address */}
                <a
                  href={`/${tx.from}`}
                  className="font-mono text-sm font-medium hover:text-primary transition-colors shrink-0"
                >
                  {shortAddr(tx.from)}
                </a>

                {/* Action label */}
                <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                  {label}
                  {tx.tokenTransfers.length > 1 && (
                    <span className="ml-1 opacity-60">+{tx.tokenTransfers.length - 1} more</span>
                  )}
                </span>

                {/* USD value */}
                <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                  {formatUsd(tx.usdValue)}
                </span>

                {/* Time */}
                <TimeAgo timestamp={tx.timestamp} />

                {/* Blockscout link */}
                <a
                  href={`https://megaeth.blockscout.com/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                {/* Track button */}
                <TrackButton address={tx.from} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
