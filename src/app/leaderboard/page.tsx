import { prisma } from "@/lib/prisma";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { TrackButton } from "@/components/leaderboard/TrackButton";

export const metadata: Metadata = {
  title: "Leaderboard — MegaStats",
};

export const revalidate = 300;

const RANK_STYLE: Record<number, { row: string; medal: string }> = {
  0: { row: "bg-yellow-50/60 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800", medal: "🥇" },
  1: { row: "bg-slate-50/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700", medal: "🥈" },
  2: { row: "bg-orange-50/60 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800", medal: "🥉" },
};

function formatPoints(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

type SortKey = "terminalPoints" | "txCount" | "weeklyPoints";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "terminalPoints", label: "Terminal Points" },
  { key: "weeklyPoints",   label: "Weekly Change" },
  { key: "txCount",        label: "Transactions" },
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { sort?: string; page?: string };
}) {
  const sort: SortKey =
    (["terminalPoints", "weeklyPoints", "txCount"] as SortKey[]).includes(searchParams.sort as SortKey)
      ? (searchParams.sort as SortKey)
      : "terminalPoints";

  const pageNum = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
  const PAGE_SIZE = 100;
  const skip = (pageNum - 1) * PAGE_SIZE;

  // Background daily refresh — seed route self-throttles to once per 23h
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";
  fetch(`${baseUrl}/api/leaderboard/seed`, {
    method: "POST",
    headers: { "x-seed-secret": process.env.SEED_SECRET ?? "megastats-seed" },
    cache: "no-store",
  }).catch(() => {});

  // Fetch leaderboard entries joined with wallet stats where available
  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: sort === "txCount" ? {} : sort === "weeklyPoints" ? { weeklyPoints: "desc" } : { rank: "asc" },
    skip,
    take: PAGE_SIZE,
  });

  // For tx-sort + track status
  const walletIds = entries.map((e) => e.address);
  const wallets = await prisma.walletCache.findMany({
    where: { id: { in: walletIds } },
    select: { id: true, txCount: true, volumeUsd: true, activeDays: true },
  });
  const walletMap = new Map(wallets.map((w) => [w.id, w]));
  // Only mark as tracked if user explicitly clicked Track — not just from a page visit
  const trackedSet = new Set(entries.filter((e) => e.isTracked).map((e) => e.address));

  let sorted = entries;
  if (sort === "txCount") {
    sorted = [...entries].sort((a, b) => {
      const wa = walletMap.get(a.address);
      const wb = walletMap.get(b.address);
      return (wb?.txCount ?? 0) - (wa?.txCount ?? 0);
    });
  }

  const totalCount = await prisma.leaderboardEntry.count();
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const top3 = pageNum === 1 ? sorted.slice(0, 3) : [];
  const rest = pageNum === 1 ? sorted.slice(3) : sorted;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Hero */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl">🏆</div>
        <h1 className="text-3xl font-bold tracking-tight">MegaETH Incentives Leaderboard</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Top {totalCount.toLocaleString()} wallets from the MegaETH Terminal incentives program · Season 1
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

      {sorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No leaderboard data yet.</p>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map((e, i) => {
                const style = RANK_STYLE[i];
                const wallet = walletMap.get(e.address);
                return (
                  <Link
                    key={e.address}
                    href={`/${e.address}`}
                    className={`rounded-xl border p-4 space-y-3 hover:scale-[1.02] transition-transform ${style.row}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{style.medal}</span>
                      <span className="text-xs font-medium text-primary">#{e.rank}</span>
                    </div>
                    <div>
                      {e.xAccount && (
                        <p className="text-xs text-muted-foreground font-medium">@{e.xAccount}</p>
                      )}
                      <p className="font-mono text-sm font-semibold text-primary">{formatAddress(e.address, 8)}</p>
                    </div>
                    <div className="space-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Terminal Points</p>
                        <p className="font-bold text-lg">{formatPoints(e.totalPoints)}</p>
                      </div>
                      {wallet && (
                        <p className="text-xs text-muted-foreground">
                          {wallet.txCount.toLocaleString()} txs · {wallet.activeDays}d active
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-12">Rank</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Wallet</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Points</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Weekly Δ</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Txs</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Volume</th>
                  <th className="px-4 py-2.5 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {rest.map((e) => {
                  const wallet = walletMap.get(e.address);
                  const volUsd = parseFloat(wallet?.volumeUsd ?? "0");
                  return (
                    <tr key={e.address} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.rank}</td>
                      <td className="px-4 py-3">
                        <div>
                          {e.xAccount && (
                            <p className="text-xs text-muted-foreground">@{e.xAccount}</p>
                          )}
                          <Link href={`/${e.address}`} className="font-mono text-primary hover:underline">
                            {formatAddress(e.address, 8)}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPoints(e.totalPoints)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                        {e.weeklyPoints > 0 ? `+${formatPoints(e.weeklyPoints)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                        {wallet ? wallet.txCount.toLocaleString() : <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                        {volUsd > 0 ? `$${volUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TrackButton address={e.address} alreadyTracked={trackedSet.has(e.address)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pb-4">
              {pageNum > 1 && (
                <Link href={`/leaderboard?sort=${sort}&page=${pageNum - 1}`}
                  className="px-3 py-1.5 rounded border text-sm hover:bg-muted/30 transition-colors">
                  ← Prev
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {pageNum} / {totalPages}
              </span>
              {pageNum < totalPages && (
                <Link href={`/leaderboard?sort=${sort}&page=${pageNum + 1}`}
                  className="px-3 py-1.5 rounded border text-sm hover:bg-muted/30 transition-colors">
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground text-center pb-4">
        Data from terminal.megaeth.com · Tx stats load on first wallet visit · Season 1 ends June 23, 2026
      </p>
    </div>
  );
}
