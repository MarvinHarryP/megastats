"use client";

import { useEffect, useState } from "react";
import { TerminalCard } from "./TerminalCard";

interface TerminalEntry {
  rank: number;
  totalPoints: number;
  weeklyPoints: number;
  xAccount: string;
  totalInLeaderboard: number;
  totalPointsSum: number;
}

interface Props {
  address: string;
  megaPrice: number | null;
}

const STORAGE_KEY = (addr: string) => `terminal_handle_${addr.toLowerCase()}`;

export function TerminalLookup({ address, megaPrice }: Props) {
  const [entry, setEntry] = useState<TerminalEntry | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);

  // On mount: check localStorage for saved handle
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(address));
    if (saved) {
      fetchByHandle(saved, false);
    } else {
      setChecked(true);
    }
  }, [address]);

  async function fetchByHandle(handle: string, save: boolean) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/terminal/lookup?handle=${encodeURIComponent(handle)}`);
      const data = await res.json();
      if (!res.ok) {
        setError("X-Handle nicht im Leaderboard gefunden.");
        if (save) localStorage.removeItem(STORAGE_KEY(address));
      } else {
        setEntry(data);
        if (save) localStorage.setItem(STORAGE_KEY(address), handle.replace(/^@/, ""));
      }
    } catch {
      setError("Fehler beim Laden.");
    } finally {
      setLoading(false);
      setChecked(true);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    fetchByHandle(input.trim(), true);
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY(address));
    setEntry(null);
    setInput("");
    setError("");
  }

  if (!checked) return null;

  if (entry) {
    return (
      <div className="space-y-1">
        <TerminalCard
          rank={entry.rank}
          totalPoints={entry.totalPoints}
          weeklyPoints={entry.weeklyPoints}
          xAccount={entry.xAccount}
          totalInLeaderboard={entry.totalInLeaderboard}
          totalPointsSum={entry.totalPointsSum}
          megaPrice={megaPrice}
        />
        <button
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          ✕ Terminal-Verknüpfung entfernen
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg">⚡</span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Terminal</p>
          <p className="text-xs text-muted-foreground mt-0.5">Verknüpfe deinen X-Handle</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="@dein_x_handle"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-0"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? "…" : "Suchen"}
        </button>
      </form>
      {error && <p className="text-xs text-destructive sm:ml-2">{error}</p>}
    </div>
  );
}
