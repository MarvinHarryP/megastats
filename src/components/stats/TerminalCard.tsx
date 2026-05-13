import Link from "next/link";

interface Props {
  rank: number;
  totalPoints: number;
  weeklyPoints: number;
  xAccount?: string | null;
  totalInLeaderboard: number;
}

function formatPoints(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toLocaleString();
}

export function TerminalCard({ rank, totalPoints, weeklyPoints, xAccount, totalInLeaderboard }: Props) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xl">⚡</span>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Weekly Rank</p>
          <p className="text-lg font-bold leading-tight">
            #{rank.toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground ml-1">of {totalInLeaderboard.toLocaleString()} this week</span>
          </p>
        </div>
      </div>

      <div className="w-px h-8 bg-border shrink-0 hidden sm:block" />

      <div className="shrink-0">
        <p className="text-xs text-muted-foreground font-medium">Total Points</p>
        <p className="text-lg font-bold leading-tight text-primary">{formatPoints(totalPoints)}</p>
      </div>

      {weeklyPoints > 0 && (
        <>
          <div className="w-px h-8 bg-border shrink-0 hidden sm:block" />
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground font-medium">This Week</p>
            <p className="text-lg font-bold leading-tight text-green-500">+{formatPoints(weeklyPoints)}</p>
          </div>
        </>
      )}

      {xAccount && (
        <>
          <div className="w-px h-8 bg-border shrink-0 hidden sm:block" />
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground font-medium">X Account</p>
            <p className="text-sm font-medium">@{xAccount}</p>
          </div>
        </>
      )}

      <div className="ml-auto shrink-0 flex items-center gap-2">
        <a
          href="https://terminal.megaeth.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-2 py-1"
        >
          Terminal →
        </a>
        <Link
          href="/leaderboard"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-2 py-1"
        >
          Leaderboard →
        </Link>
      </div>
    </div>
  );
}
