import Link from "next/link";

interface Props {
  rank: number;
  totalPoints: number;
  weeklyPoints: number;
  xAccount?: string | null;
  totalInLeaderboard: number;
  totalPointsSum: number;
  megaPrice: number | null;
}

const SEASON1_POOL = 62_500_000; // 250M total ÷ 4 estimated seasons
const DISCOUNT = 0.8; // 20% discount for missing wallets / uncertainty

function formatPoints(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toLocaleString();
}

function formatMega(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

export function TerminalCard({
  rank, totalPoints, weeklyPoints, xAccount,
  totalInLeaderboard, totalPointsSum, megaPrice,
}: Props) {
  const share = totalPointsSum > 0 ? totalPoints / totalPointsSum : 0;
  const estimatedMega = share * SEASON1_POOL * DISCOUNT;
  const estimatedUsd = megaPrice ? estimatedMega * megaPrice : null;
  const percentile = totalInLeaderboard > 0
    ? Math.round((1 - (rank - 1) / totalInLeaderboard) * 100)
    : null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">

      {/* ── Main stats row ── */}
      <div className="flex items-stretch divide-x divide-border">

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

      {/* ── Airdrop strip ── */}
      {estimatedMega > 0 && (
        <div className="border-t border-border/60 bg-muted/20 px-4 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-xl">🪂</span>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Est. Airdrop for Szn 1</p>
            <p className="text-lg font-bold leading-tight">
              ~{formatMega(estimatedMega)} MEGA
              {estimatedUsd !== null && (
                <span className="text-base text-muted-foreground font-normal ml-2">
                  ≈ ${estimatedUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              )}
            </p>
          </div>
          <p className="text-xs text-muted-foreground ml-auto italic hidden sm:block">
            2.5% of supply (250M MEGA) planned for all seasons · assumes 4 seasons → 62.5M for Szn 1 · 20% discount applied · actual may differ
          </p>
        </div>
      )}
    </div>
  );
}
