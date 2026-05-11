"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { X, Pencil, Check, Plus, ExternalLink, Activity } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { isValidAddress, formatAddress } from "@/lib/utils";

interface WalletSummary {
  txCount: number;
  volumeUsd: number;
  activeDays: number;
  lastTxAt: string | null;
  lastFetchedAt: string;
}

function formatUsd(v: number) {
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(1) + "K";
  return "$" + v.toFixed(0);
}

function TrackerCard({
  entry,
  summary,
  onRemove,
  onRename,
}: {
  entry: { address: string; label?: string; addedAt: number };
  summary?: WalletSummary;
  onRemove: () => void;
  onRename: (label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.label ?? "");

  const save = () => {
    onRename(draft.trim());
    setEditing(false);
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Top row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="Add a label…"
              className="w-full text-sm bg-transparent border-b border-primary outline-none pb-0.5"
            />
          ) : (
            <p className="text-sm font-semibold truncate">
              {entry.label || formatAddress(entry.address, 10)}
            </p>
          )}
          <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
            {formatAddress(entry.address, 12)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`/${entry.address}`}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Open in MegaStats"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {editing ? (
            <button onClick={save} className="p-1.5 rounded hover:bg-muted transition-colors text-green-500">
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => { setDraft(entry.label ?? ""); setEditing(true); }}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      {summary ? (
        <div className="border-t grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x bg-muted/20">
          <div className="px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-sm font-bold tabular-nums">{summary.txCount.toLocaleString()}</p>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="text-sm font-bold tabular-nums text-primary">{formatUsd(summary.volumeUsd)}</p>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Last Activity</p>
            <p className="text-sm font-bold tabular-nums">
              {summary.lastTxAt
                ? formatDistanceToNow(new Date(summary.lastTxAt), { addSuffix: true })
                : "—"}
            </p>
          </div>
        </div>
      ) : (
        <div className="border-t px-4 py-2 bg-muted/20 flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3 w-3 animate-pulse" />
          Wallet not yet cached — open the profile once to load stats
        </div>
      )}
    </div>
  );
}

export default function TrackerPage() {
  const { wallets, hydrated, add, remove, rename } = useWatchlist();
  const [summaries, setSummaries] = useState<Record<string, WalletSummary>>({});
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Fetch summaries for all tracked wallets
  useEffect(() => {
    if (!hydrated || wallets.length === 0) return;
    const addresses = wallets.map((w) => w.address);
    fetch("/api/wallets/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses }),
    })
      .then((r) => r.json())
      .then((data) => setSummaries(data.summaries ?? {}))
      .catch(() => {});
  }, [hydrated, wallets]);

  const handleAdd = () => {
    const addr = input.trim().toLowerCase();
    if (!isValidAddress(addr)) { setInputError(true); return; }
    add(addr);
    setInput("");
    setInputError(false);
    setShowInput(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">👀 Mein Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track wallets from the Whale Feed
          </p>
        </div>
        <button
          onClick={() => setShowInput((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add wallet
        </button>
      </div>

      {showInput && (
        <div className="mb-4 flex gap-2">
          <input
            autoFocus
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="0x... wallet address"
            className={`flex-1 font-mono text-sm px-3 py-2 rounded-md border bg-background outline-none focus:border-primary transition-colors ${
              inputError ? "border-red-500" : "border-border"
            }`}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add
          </button>
        </div>
      )}

      {!hydrated ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">🐋</p>
          <p className="font-medium">No wallets tracked yet</p>
          <p className="text-sm mt-1">
            Add them from the{" "}
            <a href="/whales" className="text-primary hover:underline">Whale Feed</a>{" "}
            or enter an address manually
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {wallets
            .slice()
            .sort((a, b) => b.addedAt - a.addedAt)
            .map((entry) => (
              <TrackerCard
                key={entry.address}
                entry={entry}
                summary={summaries[entry.address]}
                onRemove={() => remove(entry.address)}
                onRename={(label) => rename(entry.address, label)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
