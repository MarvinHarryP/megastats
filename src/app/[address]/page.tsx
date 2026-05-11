export const dynamic = "force-dynamic";

import { isValidAddress, formatAddress } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getOrSyncWallet } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { StatsGrid } from "@/components/stats/StatsGrid";
import { ActivityChart } from "@/components/charts/ActivityChart";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap";
import { TxTable } from "@/components/transactions/TxTable";
import { RefreshButton } from "@/components/shared/RefreshButton";
import { CopyButton } from "@/components/shared/CopyButton";
import { ExternalLink } from "lucide-react";
import { DashboardClient } from "./DashboardClient";
import { BalanceCard } from "@/components/stats/BalanceCard";
import { NFTGallery } from "@/components/stats/NFTGallery";
import { DeFiPositions } from "@/components/stats/DeFiPositions";
import { fetchDefiPositions } from "@/lib/defi-fetcher";

interface Props {
  params: { address: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `${formatAddress(params.address)} — MegaStats`,
  };
}

export default async function AddressPage({ params }: Props) {
  const address = params.address.toLowerCase();

  if (!isValidAddress(address)) {
    notFound();
  }

  let data;
  let rank: number | null = null;
  let totalTracked = 0;
  let initialDefiPositions;
  try {
    [data, initialDefiPositions] = await Promise.all([
      getOrSyncWallet(address),
      fetchDefiPositions(address).catch(() => []),
    ]);
    const [above, total] = await Promise.all([
      prisma.walletCache.count({ where: { txCount: { gt: data.stats.txCount } } }),
      prisma.walletCache.count({ where: { txCount: { gt: 0 } } }),
    ]);
    rank = above + 1;
    totalTracked = total;
  } catch {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-lg font-semibold">Failed to load wallet data</p>
        <p className="text-muted-foreground text-sm">The Blockscout API may be unavailable. Try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-lg font-semibold">{formatAddress(address, 10)}</h1>
          <CopyButton text={address} />
          <a
            href={`https://megaeth.blockscout.com/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Blockscout Explorer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href="https://terminal.megaeth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            Click here to check Rank & Points →
          </a>
        </div>
        <div className="flex items-center gap-3">
          {rank !== null && totalTracked > 0 && (
            <a href="/leaderboard" className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-medium hover:opacity-80 transition-opacity">
              #{rank} of {totalTracked} tracked
            </a>
          )}
          <DashboardClient address={address} lastUpdatedAt={data.lastUpdatedAt} />
        </div>
      </div>

      <StatsGrid stats={data.stats} dailyActivity={data.dailyActivity} />

      <BalanceCard address={address} />

      {/* DeFiPositions temporarily hidden — re-enable when ready */}
      {/* <DeFiPositions address={address} initialDefiPositions={initialDefiPositions} /> */}

      <NFTGallery address={address} />

      <ActivityHeatmap data={data.dailyActivity} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityChart data={data.dailyActivity} />
        <VolumeChart data={data.dailyActivity} />
      </div>

      <TxTable address={address} />
    </div>
  );
}
