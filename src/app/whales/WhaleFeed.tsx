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

const CACHE_KEY = "megastats_whales_feed";
const CACHE_TTL_MS = 30 * 60 * 1000;

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

function TxRow({ tx }: { tx: WhaleTx }) {
  const mainTransfer = tx.tokenTransfers[0];
  const label = tx.method
    ? tx.method.replace(/_/g, " ")
    : mainTransfer
    ? `${mainTransfer.symbol} Transfer`
    : tx.ethValue > 0
    ? "ETH Transfer"
    : "Contract Call";

  return (
    <div className="px-4 py-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
      {/* Row 1: address + value */}
      <div className="flex items-center justify-between gap-2">
        <a
          href={`/${tx.from}`}
          className="font-mono text-sm font-medium hover:text-primary transition-colors shrink-0"
        >
          {shortAddr(tx.from)}
        </a>
        <span className="text-sm font-bold text-primary tabular-nums shrink-0">
          {formatUsd(tx.usdValue)}
        </span>
      </div>
      {/* Row 2: label + time + icons */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
          {label}
          {tx.tokenTransfers.length > 1 && (
            <span className="ml-1 opacity-60">+{tx.tokenTransfers.length - 1} more</span>
          )}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <TimeAgo timestamp={tx.timestamp} />
          <a
            href={`https://megaeth.blockscout.com/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <TrackButton address={tx.from} />
        </div>
      </div>
    </div>
  );
}

interface Props {
  initialTxs: WhaleTx[];
}

export function WhaleFeed({ initialTxs }: Props) {
  const initialLoad = useRef(true);
  const [txs, setTxs] = useState<WhaleTx[]>(initialTxs);
  const [min, setMin] = useState(1_000);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const seenHashes = useRef(new Set<string>(initialTxs.map((t) => t.hash)));

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`/api/whales/feed?min=${min}`);
      const data = await res.json();
      const incoming: WhaleTx[] = data.txs ?? [];

      setTxs((prev) => {
        const merged: WhaleTx[] = [...incoming];
        for (const tx of prev) {
          if (!merged.find((t) => t.hash === tx.hash)) merged.push(tx);
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
    if (initialLoad.current) {
      // First mount: restore localStorage cache if fresher than server data
      const cached = loadCached();
      if (cached.length > 0) setTxs(cached);
      initialLoad.current = false;
    } else {
      // Filter changed
      setTxs([]);
      setLoading(true);
    }
    fetchFeed();
    const interval = setInterval(fetchFeed, 5_000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">🐋 Whale Watcher</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Biggest transactions on MegaETH — live
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          {lastUpdate && (
            <span>· updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
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
          <p className="font-medium">No transactions above {formatUsd(min)} found</p>
          <p className="text-sm mt-1">Try a lower filter</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {txs.map((tx) => <TxRow key={tx.hash} tx={tx} />)}
        </div>
      )}
    </>
  );
}
