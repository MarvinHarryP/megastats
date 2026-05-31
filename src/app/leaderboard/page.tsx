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
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { sort?: string; page?: string; q?: string };
}) {
  const sort: SortKey =
    (["terminalPoints", "weeklyPoints", "txCount"] as SortKey[]).includes(searchParams.sort as SortKey)
      ? (searchParams.sort as SortKey)
      : "terminalPoints";

  const q = searchParams.q?.trim() ?? "";
  const pageNum = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
  const PAGE_SIZE = 100;
  const skip = q ? 0 : (pageNum - 1) * PAGE_SIZE; // no pagination when searching

  // Background daily refresh — seed route self-throttles to once per 23h
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";
  fetch(`${baseUrl}/api/leaderboard/seed`, {
    method: "POST",
    headers: { "x-seed-secret": process.env.SEED_SECRET ?? "megastats-seed" },
    cache: "no-store",
  }).catch(() => {});

  // Build search filter
  const where = q
    ? {
        OR: [
          { xAccount: { contains: q } },
          { displayName: { contains: q } },
          { address: { contains: q } },
        ],
      }
    : {};

  // Fetch leaderboard entries — always sort by totalPoints for "terminalPoints", weeklyPoints for "weeklyPoints"
  const entries = await prisma.leaderboardEntry.findMany({
    where,
    orderBy: sort === "txCount" ? {} : sort === "weeklyPoints" ? { weeklyPoints: "desc" } : { totalPoints: "desc" },
    skip,
    take: PAGE_SIZE,
  });

  // When searching, also fetch 5 entries above + below each match by rank for context
  const matchedAddresses = new Set<string>();
  let sorted = entries;

  if (q && entries.length > 0) {
    entries.forEach((e) => matchedAddresses.add(e.address));
    const CONTEXT = 5;
    const contextResults = await Promise.all(
      entries.map((match) =>
        prisma.leaderboardEntry.findMany({
          where: { rank: { gte: match.rank - CONTEXT, lte: match.rank + CONTEXT } },
          orderBy: sort === "weeklyPoints" ? { weeklyPoints: "desc" } : { totalPoints: "desc" },
        })
      )
    );
    // Merge + deduplicate, keep order
    const seen = new Set<string>();
    const merged = [...entries, ...contextResults.flat()].filter((e) => {
      if (seen.has(e.address)) return false;
      seen.add(e.address);
      return true;
    });
    sorted = merged.sort((a, b) =>
      sort === "weeklyPoints" ? b.weeklyPoints - a.weeklyPoints : b.totalPoints - a.totalPoints
    );
  }

  // For tx-sort + track status — only real wallet addresses (not terminal:rank:X keys)
  const walletIds = sorted.map((e) => e.address).filter((a) => !a.startsWith("terminal:"));
  const wallets = await prisma.walletCache.findMany({
    where: { id: { in: walletIds } },
    select: { id: true, txCount: true, volumeUsd: true, activeDays: true },
  });
  const walletMap = new Map(wallets.map((w) => [w.id, w]));

  if (!q && sort === "txCount") {
    sorted = [...sorted].sort((a, b) => {
      const wa = walletMap.get(a.address);
      const wb = walletMap.get(b.address);
      return (wb?.txCount ?? 0) - (wa?.txCount ?? 0);
    });
  }

  // Only mark as tracked if user explicitly clicked Track — not just from a page visit
  const trackedSet = new Set(sorted.filter((e) => e.isTracked && !e.address.startsWith("terminal:")).map((e) => e.address));

  const [totalCount, totalPointsAgg, top100Agg] = await Promise.all([
    prisma.leaderboardEntry.count(),
    prisma.leaderboardEntry.aggregate({ _sum: { totalPoints: true } }),
    // Top 100 by totalPoints — sum their points
    prisma.leaderboardEntry.findMany({
      orderBy: { totalPoints: "desc" },
      take: 100,
      select: { totalPoints: true },
    }),
  ]);
  const totalPointsDistributed = totalPointsAgg._sum.totalPoints ?? 0;
  const top100Sum = top100Agg.reduce((s, e) => s + e.totalPoints, 0);
  const top100Pct = totalPointsDistributed > 0 ? Math.round((top100Sum / totalPointsDistributed) * 100) : 0;
  // Count wallets where weeklyPoints >= 75% of totalPoints (can't do this in Prisma directly, so fetch and filter)
  const hotWalletsCountReal = await prisma.$queryRaw<[{ count: number }]>`
    SELECT COUNT(*) as count FROM leaderboard_entry
    WHERE weeklyPoints > 0 AND CAST(weeklyPoints AS REAL) / CAST(totalPoints AS REAL) >= 0.75
  `;
  const hotCount = Number(hotWalletsCountReal[0]?.count ?? 0);
  const filteredCount = q ? sorted.length : totalCount;
  const totalPages = q ? 1 : Math.ceil(totalCount / PAGE_SIZE);
  // When searching, skip the podium — show all results in table with real rank
  const top3 = pageNum === 1 && !q ? sorted.slice(0, 3) : [];
  const rest = pageNum === 1 && !q ? sorted.slice(3) : sorted;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Hero */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl">🏆</div>
        <h1 className="text-3xl font-bold tracking-tight">MegaETH Incentives Leaderboard</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {totalCount.toLocaleString()} wallets · {formatPoints(totalPointsDistributed)} points distributed · Season 1
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <span className="text-xs bg-muted/60 rounded-full px-3 py-1 text-muted-foreground">
            🏦 Top 100 hold <span className="font-semibold text-foreground">{top100Pct}%</span> of all points
          </span>
          <span className="text-xs bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-full px-3 py-1 text-orange-700 dark:text-orange-400">
            🔥 <span className="font-semibold">{hotCount}</span> wallets earned 75%+ of their points this week
          </span>
        </div>
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

      {/* Search */}
      <form method="GET" action="/leaderboard" className="flex gap-2 max-w-sm mx-auto">
        <input type="hidden" name="sort" value={sort} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by @handle or address…"
          autoComplete="off"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {q ? (
          <Link
            href={`/leaderboard?sort=${sort}`}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </Link>
        ) : (
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Search
          </button>
        )}
      </form>

      {q && (
        <p className="text-center text-sm text-muted-foreground -mt-2">
          {filteredCount === 0
            ? `No results for "${q}"`
            : `${filteredCount} result${filteredCount === 1 ? "" : "s"} for "${q}"`}
        </p>
      )}

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
                const isReal = !e.address.startsWith("terminal:");
                const label = e.xAccount ?? e.displayName;
                // For totalPoints/txCount sorts, use the position in our sorted list.
                // For weeklyPoints sort, Terminal's stored rank IS the weekly rank.
                const displayedRank = sort === "weeklyPoints" ? e.rank : skip + i + 1;
                const inner = (
                  <div className={`rounded-xl border p-4 space-y-3 hover:scale-[1.02] transition-transform ${style.row}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{style.medal}</span>
                      <span className="text-xs font-medium text-primary">#{displayedRank}</span>
                    </div>
                    <div>
                      {label && (
                        <p className="text-xs text-muted-foreground font-medium">
                          {e.xAccount ? `@${label}` : label}
                        </p>
                      )}
                      <p className="font-mono text-sm font-semibold text-primary">
                        {isReal ? formatAddress(e.address, 8) : (label ?? `Rank #${displayedRank}`)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Terminal Points</p>
                        <p className="font-bold text-lg">{formatPoints(e.totalPoints)}</p>
                        {e.weeklyPoints > 0 && (
                          <p className="text-xs text-green-500 font-medium">
                            +{formatPoints(e.weeklyPoints)} this week
                            <span className="text-muted-foreground ml-1">({Math.round((e.weeklyPoints / e.totalPoints) * 100)}% of total{e.weeklyPoints / e.totalPoints >= 0.75 ? (
                              <span className="relative group ml-0.5 cursor-default">
                                🔥
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-48 rounded-md bg-popover border border-border shadow-md px-2.5 py-1.5 text-xs text-popover-foreground whitespace-normal text-center pointer-events-none">
                                  75%+ of total points earned this week
                                </span>
                              </span>
                            ) : ""})</span>
                          </p>
                        )}
                      </div>
                      {wallet && (
                        <p className="text-xs text-muted-foreground">
                          {wallet.txCount.toLocaleString()} txs · {wallet.activeDays}d active
                        </p>
                      )}
                    </div>
                  </div>
                );
                return isReal ? (
                  <Link key={e.address} href={`/${e.address}`}>{inner}</Link>
                ) : (
                  <div key={e.address}>{inner}</div>
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
                {rest.map((e, i) => {
                  const wallet = walletMap.get(e.address);
                  const volUsd = parseFloat(wallet?.volumeUsd ?? "0");
                  const isReal = !e.address.startsWith("terminal:");
                  const label = e.xAccount ?? e.displayName;
                  // Position-based rank for totalPoints/txCount; Terminal's rank for weeklyPoints
                  const positionInList = (pageNum === 1 && !q ? 3 : 0) + i + 1;
                  const displayedRank = q ? e.rank : sort === "weeklyPoints" ? e.rank : skip + positionInList;
                  const isMatch = q ? matchedAddresses.has(e.address) : false;
                  const isHotThisWeek = e.weeklyPoints > 0 && e.weeklyPoints / e.totalPoints >= 0.75;
                  return (
                    <tr key={e.address} className={`border-b last:border-0 transition-colors ${isMatch ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{displayedRank}</td>
                      <td className="px-4 py-3">
                        <div>
                          {e.xAccount && (
                            <p className="text-xs text-muted-foreground">@{e.xAccount}</p>
                          )}
                          {isReal ? (
                            <Link href={`/${e.address}`} className="font-mono text-primary hover:underline">
                              {formatAddress(e.address, 8)}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              {label ?? `Rank #${displayedRank}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPoints(e.totalPoints)}</td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {e.weeklyPoints > 0 ? (
                          <div>
                            <span className="text-green-500 font-medium">+{formatPoints(e.weeklyPoints)}</span>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((e.weeklyPoints / e.totalPoints) * 100)}% of total{isHotThisWeek && (
                                <span className="relative group ml-0.5 cursor-default">
                                  🔥
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-48 rounded-md bg-gray-900 dark:bg-gray-100 shadow-md px-2.5 py-1.5 text-xs text-gray-100 dark:text-gray-900 whitespace-normal text-center pointer-events-none">
                                    75%+ of total points earned this week
                                  </span>
                                </span>
                              )}
                            </p>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                        {wallet ? wallet.txCount.toLocaleString() : <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                        {volUsd > 0 ? `$${volUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isReal && <TrackButton address={e.address} alreadyTracked={trackedSet.has(e.address)} />}
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
                <Link href={`/leaderboard?sort=${sort}&page=${pageNum - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 py-1.5 rounded border text-sm hover:bg-muted/30 transition-colors">
                  ← Prev
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {pageNum} / {totalPages}
              </span>
              {pageNum < totalPages && (
                <Link href={`/leaderboard?sort=${sort}&page=${pageNum + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 py-1.5 rounded border text-sm hover:bg-muted/30 transition-colors">
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pb-1">
        <span>🔥 = 75%+ of total points earned this week</span>
      </div>
      <p className="text-xs text-muted-foreground text-center pb-4">
        Data from terminal.megaeth.com · Tx stats load on first wallet visit · Season 1 ends June 23, 2026
      </p>
    </div>
  );
}
