"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { X, Pencil, Check, Plus, ExternalLink } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { isValidAddress, formatAddress } from "@/lib/utils";

function TrackerCard({
  entry,
  onRemove,
  onRename,
}: {
  entry: { address: string; label?: string; addedAt: number };
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
    <div className="rounded-xl border bg-card px-4 py-3.5 flex items-center gap-3">
      {/* Label / address */}
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
            placeholder="Label vergeben…"
            className="w-full text-sm bg-transparent border-b border-primary outline-none pb-0.5"
          />
        ) : (
          <p className="text-sm font-semibold truncate">
            {entry.label || formatAddress(entry.address, 10)}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs font-mono text-muted-foreground truncate">
            {formatAddress(entry.address, 10)}
          </p>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            hinzugefügt {formatDistanceToNow(new Date(entry.addedAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={`/${entry.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="MegaStats öffnen"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {editing ? (
          <button
            onClick={save}
            className="p-1.5 rounded hover:bg-muted transition-colors text-green-500"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => { setDraft(entry.label ?? ""); setEditing(true); }}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Label bearbeiten"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={onRemove}
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-400"
          title="Entfernen"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const { wallets, hydrated, add, remove, rename } = useWatchlist();
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleAdd = () => {
    const addr = input.trim().toLowerCase();
    if (!isValidAddress(addr)) {
      setInputError(true);
      return;
    }
    add(addr);
    setInput("");
    setInputError(false);
    setShowInput(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">👀 Mein Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Beobachte Wallets aus dem Whale Feed
          </p>
        </div>
        <button
          onClick={() => setShowInput((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          Wallet hinzufügen
        </button>
      </div>

      {/* Manual add input */}
      {showInput && (
        <div className="mb-4 flex gap-2">
          <input
            autoFocus
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="0x... Wallet-Adresse"
            className={`flex-1 font-mono text-sm px-3 py-2 rounded-md border bg-background outline-none focus:border-primary transition-colors ${
              inputError ? "border-red-500" : "border-border"
            }`}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Hinzufügen
          </button>
        </div>
      )}

      {/* Wallet list */}
      {!hydrated ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">🐋</p>
          <p className="font-medium">Noch keine Wallets im Tracker</p>
          <p className="text-sm mt-1">
            Füge sie aus dem{" "}
            <a href="/whales" className="text-primary hover:underline">
              Whale Feed
            </a>{" "}
            hinzu oder gib eine Adresse manuell ein
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
                onRemove={() => remove(entry.address)}
                onRename={(label) => rename(entry.address, label)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
