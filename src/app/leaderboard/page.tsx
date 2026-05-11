import { prisma } from "@/lib/prisma";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — MegaStats",
};

export const revalidate = 60;

const RANK_STYLE: Record<number, { row: string; medal: string }> = {
  0: { row: "bg-yellow-50/60 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800", medal: "🥇" },
  1: { row: "bg-slate-50/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700", medal: "🥈" },
  2: { row: "bg-orange-50/60 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800", medal: "🥉" },
};

type SortKey = "txCount" | "volumeUsd" | "activeDays";

const SORT_OPTIONS: { key: SortKey; label: string; col: string }[] = [
  { key: "txCount",   label: "Transactions", col: "Txs" },
  { key: "volumeUsd", label: "Volume (USD)",  col: "Volume" },
  { key: "activeDays",label: "Active Days",   col: "Active Days" },
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort: SortKey =
    (searchParams.sort as SortKey) && ["txCount", "volumeUsd", "activeDays"].includes(searchParams.sort!)
      ? (searchParams.sort as SortKey)
      : "txCount";

  const rawWallets = await prisma.walletCache.findMany({
    where: { txCount: { gt: 0 } },
    select: {
      id: true,
      txCount: true,
      volumeUsd: true,
      activeDays: true,
      uniqueContracts: true,
      currentStreak: true,
    },
  });

  const wallets = rawWallets.sort((a, b) => {
    if (sort === "volumeUsd") return parseFloat(b.volumeUsd) - parseFloat(a.volumeUsd);
    if (sort === "activeDays") return b.activeDays - a.activeDays;
    return b.txCount - a.txCount;
  });

  const top3 = wallets.slice(0, 3);
  const rest = wallets.slice(3);

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Hero */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl">🏆</div>
        <h1 className="text-3xl font-bold tracking-tight">MegaStats Leaderboard</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Top wallets by on-chain activity — ranked among wallets searched on this platform only.
        </p>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 justify-center flex-wrap">
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.key}
            href={`/leaderboard?sort=${opt.key}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              sort === opt.key
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground border-border hover:text-foreground hover:border-foreground"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {wallets.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No wallets tracked yet — search one to get started.</p>
      ) : (
        <>
          {/* Top 3 podium cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map((w, i) => {
                const style = RANK_STYLE[i];
                const volUsd = parseFloat(w.volumeUsd);
                const mainValue =
                  sort === "volumeUsd"
                    ? volUsd > 0 ? `$${volUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"
                    : sort === "activeDays"
                    ? `${w.activeDays} days`
                    : w.txCount.toLocaleString();
                const mainLabel =
                  sort === "volumeUsd" ? "Volume" : sort === "activeDays" ? "Active Days" : "Transactions";

                return (
                  <Link
                    key={w.id}
                    href={`/${w.id}`}
                    className={`rounded-xl border p-4 space-y-3 hover:scale-[1.02] transition-transform ${style.row}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{style.medal}</span>
                      {w.currentStreak > 0 && (
                        <span className="text-xs text-muted-foreground">🔥 {w.currentStreak}d</span>
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-primary">{formatAddress(w.id, 8)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{w.activeDays} active days · {w.uniqueContracts} contracts</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{mainLabel}</p>
                      <p className="font-bold text-lg">{mainValue}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Rest of the list */}
          {rest.length > 0 && (
            <>
              {/* Mobile cards (< sm) */}
              <div className="sm:hidden space-y-2">
                {rest.map((w, i) => {
                  const volUsd = parseFloat(w.volumeUsd);
                  const mainValue =
                    sort === "volumeUsd"
                      ? volUsd > 0 ? `$${volUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"
                      : sort === "activeDays"
                      ? `${w.activeDays} days`
                      : w.txCount.toLocaleString();
                  return (
                    <div key={w.id} className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
                      <span className="text-base font-bold text-muted-foreground w-8 shrink-0 tabular-nums">{i + 4}</span>
                      <div className="flex-1 min-w-0">
                        <Link href={`/${w.id}`} className="font-mono text-sm font-medium text-primary hover:underline truncate block">
                          {formatAddress(w.id, 10)}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {w.txCount.toLocaleString()} txs
                          {volUsd > 0 && ` · $${volUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                          {` · ${w.activeDays}d active`}
                          {w.currentStreak > 0 && ` · 🔥${w.currentStreak}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums shrink-0">{mainValue}</span>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table (≥ sm) */}
              <div className="hidden sm:block rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-12">#</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Wallet</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Txs</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Volume</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Contracts</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Active Days</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((w, i) => {
                      const volUsd = parseFloat(w.volumeUsd);
                      return (
                        <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 4}</td>
                          <td className="px-4 py-3">
                            <Link href={`/${w.id}`} className="font-mono text-primary hover:underline">
                              {formatAddress(w.id, 8)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{w.txCount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {volUsd > 0 ? `$${volUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{w.uniqueContracts}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{w.activeDays}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                            {w.currentStreak > 0 ? `🔥 ${w.currentStreak}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground text-center pb-4">
        Only wallets searched on MegaStats appear here · Data refreshes every 5 min
      </p>
    </div>
  );
}
