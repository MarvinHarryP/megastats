"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  rank: number;
  totalPoints: number;
  weeklyPoints: number;
  xAccount?: string | null;
  totalInLeaderboard: number;
  totalPointsSum: number;
  megaPrice: number | null;
}

const USDM_RATES = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50];

function formatPoints(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toLocaleString();
}

export function TerminalCard({
  rank, totalPoints, weeklyPoints, xAccount,
  totalInLeaderboard,
}: Props) {
  const [selectedRate, setSelectedRate] = useState(0.20);
  const [customPoints, setCustomPoints] = useState<string>("");
  const activePoints = customPoints !== "" ? parseFloat(customPoints) || 0 : totalPoints;
  const estimatedUsdm = activePoints * selectedRate;

  const percentile = totalInLeaderboard > 0
    ? Math.round((1 - (rank - 1) / totalInLeaderboard) * 100)
    : null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">

      {/* ── Main stats row ── */}
      <div className="flex flex-wrap sm:flex-nowrap items-stretch divide-y sm:divide-y-0 sm:divide-x divide-border">

        {/* Label col */}
        <div className="flex items-center gap-2 px-4 py-3 shrink-0">
          <span className="text-lg">⚡</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Terminal</p>
            {xAccount && (
              <p className="text-xs text-muted-foreground mt-0.5">@{xAccount}</p>
            )}
          </div>
        </div>

        {/* This Week — Rank */}
        <div className="px-4 py-3 flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">This Week</p>
          <p className="text-2xl font-bold leading-tight mt-0.5">
            #{rank.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            of {totalInLeaderboard.toLocaleString()} active
            {percentile !== null && (
              <span className="ml-1 text-primary font-medium">· top {percentile}%</span>
            )}
          </p>
        </div>

        {/* This Week — Earned */}
        <div className="px-4 py-3 flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Earned</p>
          {weeklyPoints > 0 ? (
            <>
              <p className="text-2xl font-bold text-green-500 leading-tight mt-0.5">+{formatPoints(weeklyPoints)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">points this week</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground/40 leading-tight mt-0.5">—</p>
          )}
        </div>

        {/* All Time — Total Points */}
        <div className="px-4 py-3 flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">All Time</p>
          <p className="text-2xl font-bold text-primary leading-tight mt-0.5">{formatPoints(totalPoints)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">terminal points</p>
        </div>

        {/* Links */}
        <div className="flex flex-col items-end justify-center gap-1.5 px-4 py-3 shrink-0">
          <a
            href="https://terminal.megaeth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-2 py-1 whitespace-nowrap"
          >
            Terminal →
          </a>
          <Link
            href="/leaderboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-2 py-1 whitespace-nowrap"
          >
            Leaderboard →
          </Link>
        </div>
      </div>

      {/* ── USDM Rewards Calculator ── */}
      <div className="border-t border-border/60 bg-muted/20 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">USDM Rewards Calculator</p>
              <p className="text-lg font-bold leading-tight">
                ~${estimatedUsdm.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDM
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {USDM_RATES.map((rate) => (
              <button
                key={rate}
                onClick={() => setSelectedRate(rate)}
                className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                  selectedRate === rate
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground border-border hover:text-foreground hover:border-foreground"
                }`}
              >
                ${rate.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={customPoints}
            onChange={(e) => setCustomPoints(e.target.value)}
            placeholder={`${totalPoints.toLocaleString()} pts (your wallet)`}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {customPoints !== "" && (
            <button
              onClick={() => setCustomPoints("")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground italic">
          Terminal ended early (Week 3) · Rewards paid in USDM · community estimates only
        </p>
      </div>
    </div>
  );
}
