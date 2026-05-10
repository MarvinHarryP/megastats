"use client";

import { useEffect, useState } from "react";
import { Zap, TrendingUp, Hash, Flame, Code2, Clock } from "lucide-react";
import { StatCard } from "./StatCard";
import { formatEthCompact, weiToUsd } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { WalletStats, DailyActivityPoint } from "@/types/stats";

interface StatsGridProps {
  stats?: WalletStats;
  dailyActivity?: DailyActivityPoint[];
  loading?: boolean;
}

export function StatsGrid({ stats, dailyActivity, loading }: StatsGridProps) {
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => {
    fetch("/api/ethprice")
      .then((r) => r.json())
      .then((d) => setEthPrice(d.price ?? 0));
  }, []);

  const totalVolume = stats
    ? (BigInt(stats.volumeInWei) + BigInt(stats.volumeOutWei)).toString()
    : "0";

  const walletAge = stats?.firstTxAt
    ? formatDistanceToNow(new Date(stats.firstTxAt), { addSuffix: false })
    : null;

  const volumeUsdNum = parseFloat(stats?.volumeUsd ?? "0");

  return (
    <div className="space-y-3">
      {/* Row 1: Core metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Fees Paid"
          icon={Zap}
          loading={loading}
          iconClassName="bg-yellow-100 dark:bg-yellow-900/30"
          value={
            <span className="text-yellow-600 dark:text-yellow-400">
              {formatEthCompact(stats?.feesWei ?? "0")}
            </span>
          }
          subtitle={
            ethPrice > 0 && stats
              ? `≈ ${weiToUsd(stats.feesWei, ethPrice)}`
              : `${stats?.txCount ?? 0} txs`
          }
        />
        <StatCard
          label="Volume (USD)"
          icon={TrendingUp}
          loading={loading}
          iconClassName="bg-blue-100 dark:bg-blue-900/30"
          value={
            <span className="text-blue-600 dark:text-blue-400">
              {volumeUsdNum > 0
                ? `$${volumeUsdNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : formatEthCompact(totalVolume)}
            </span>
          }
          subtitle={
            volumeUsdNum > 0
              ? `${formatEthCompact(stats?.volumeOutWei ?? "0")} out · Token Transfers incl.*`
              : ethPrice > 0 && stats
              ? `≈ ${weiToUsd(totalVolume, ethPrice)}`
              : undefined
          }
        />
        <StatCard
          label="Transactions"
          icon={Hash}
          loading={loading}
          iconClassName="bg-purple-100 dark:bg-purple-900/30"
          value={
            <span className="text-purple-600 dark:text-purple-400">
              {stats?.txCount.toLocaleString() ?? "0"}
            </span>
          }
          subtitle={
            stats
              ? `${stats.txCountSent} sent · ${stats.txCountReceived} received · ${stats.txCountContract} calls`
              : undefined
          }
        />
        <StatCard
          label="Active Days"
          icon={Flame}
          loading={loading}
          iconClassName={
            (stats?.currentStreak ?? 0) >= 7
              ? "bg-green-100 dark:bg-green-900/30"
              : (stats?.currentStreak ?? 0) >= 3
              ? "bg-orange-100 dark:bg-orange-900/30"
              : "bg-muted"
          }
          value={
            <span
              className={
                (stats?.currentStreak ?? 0) >= 7
                  ? "text-green-600 dark:text-green-400"
                  : (stats?.currentStreak ?? 0) >= 3
                  ? "text-orange-500 dark:text-orange-400"
                  : ""
              }
            >
              {stats?.activeDays ?? 0} days
            </span>
          }
          subtitle={
            stats
              ? `🔥 ${stats.currentStreak} day streak · longest ${stats.longestStreak}`
              : undefined
          }
        />
      </div>

      {/* Row 2: Airdrop eligibility signals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Unique Contracts"
          icon={Code2}
          loading={loading}
          iconClassName="bg-pink-100 dark:bg-pink-900/30"
          value={
            <span className="text-pink-600 dark:text-pink-400">
              {stats?.uniqueContracts ?? 0}
            </span>
          }
          subtitle="distinct dApps / protocols"
        />
        <StatCard
          label="Wallet Age"
          icon={Clock}
          loading={loading}
          iconClassName="bg-teal-100 dark:bg-teal-900/30"
          value={
            <span className="text-teal-600 dark:text-teal-400 text-xl">
              {walletAge ?? "—"}
            </span>
          }
          subtitle={
            stats?.firstTxAt
              ? `First tx ${new Date(stats.firstTxAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : "No transactions yet"
          }
        />
        <StatCard
          label="Contract Calls"
          icon={Hash}
          loading={loading}
          iconClassName="bg-amber-100 dark:bg-amber-900/30"
          value={
            <span className="text-amber-600 dark:text-amber-400">
              {stats?.txCountContract ?? 0}
            </span>
          }
          subtitle={
            stats && stats.txCount > 0
              ? `${Math.round((stats.txCountContract / stats.txCount) * 100)}% of all txs`
              : undefined
          }
        />
      </div>
    </div>
  );
}
