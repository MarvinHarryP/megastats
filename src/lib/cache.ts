import { prisma } from "@/lib/prisma";
import { fetchAllTransactions, fetchAllTokenTransfers, fetchNewTransactions } from "@/lib/blockscout";
import { computeStats, classifyAndMapTx } from "@/lib/stats";
import type { StatsResponse } from "@/types/stats";

const TTL_MS = Math.max(60, parseInt(process.env.CACHE_TTL_SECONDS ?? "300")) * 1000;

export async function getOrSyncWallet(address: string): Promise<StatsResponse> {
  const addr = address.toLowerCase();
  const cached = await prisma.walletCache.findUnique({
    where: { id: addr },
    include: { dailyActivity: { orderBy: { date: "asc" } } },
  });

  const isStale = !cached || Date.now() - cached.lastFetchedAt.getTime() > TTL_MS;

  if (!isStale && cached) {
    return buildResponse(addr, cached, cached.dailyActivity);
  }

  try {
    // If we have a cache, only fetch new txs since last known block (fast)
    if (cached && cached.fetchedThrough > 0) {
      return await incrementalSync(addr, cached.fetchedThrough);
    }
    // First-time load: full fetch
    return await syncWallet(addr);
  } catch (err) {
    if (cached) return buildResponse(addr, cached, cached.dailyActivity);
    throw err;
  }
}

async function incrementalSync(address: string, sinceBlock: number): Promise<StatsResponse> {
  // Only fetch txs newer than what we already have — typically just 1-2 pages
  const newTxs = await fetchNewTransactions(address, sinceBlock);

  if (newTxs.length === 0) {
    // Nothing new — just bump the timestamp so TTL resets
    await prisma.walletCache.update({
      where: { id: address },
      data: { lastFetchedAt: new Date() },
    });
    const cached = await prisma.walletCache.findUniqueOrThrow({
      where: { id: address },
      include: { dailyActivity: { orderBy: { date: "asc" } } },
    });
    return buildResponse(address, cached, cached.dailyActivity);
  }

  // New txs found — do a full sync so stats are always 100% correct
  return await syncWallet(address);
}

export async function forceRefreshWallet(address: string): Promise<StatsResponse> {
  const addr = address.toLowerCase();
  await prisma.walletCache.deleteMany({ where: { id: addr } });
  return syncWallet(addr);
}

async function syncWallet(address: string): Promise<StatsResponse> {
  const [rawTxs, tokenTransfers, ethPriceData, addressData] = await Promise.all([
    fetchAllTransactions(address),
    fetchAllTokenTransfers(address),
    fetch("https://megaeth.blockscout.com/api/v2/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => parseFloat(d.coin_price ?? "0"))
      .catch(() => 0),
    fetch(`https://megaeth.blockscout.com/api/v2/addresses/${address}`, { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => null),
  ]);

  const realTxCount: number = addressData?.transactions_count ?? null;

  const { stats, dailyActivity } = computeStats(
    address,
    rawTxs,
    tokenTransfers,
    ethPriceData
  );

  // Override txCount with real value from Blockscout if available
  if (realTxCount !== null && realTxCount > stats.txCount) {
    stats.txCount = realTxCount;
  }

  const maxBlock = rawTxs.reduce((m, tx) => Math.max(m, tx.block_number ?? 0), 0);
  const mappedTxs = rawTxs.map((tx) => classifyAndMapTx(tx, address));

  // Upsert wallet cache
  await prisma.walletCache.upsert({
    where: { id: address },
    create: { id: address, lastFetchedAt: new Date(), fetchedThrough: maxBlock, ...stats },
    update: { lastFetchedAt: new Date(), fetchedThrough: maxBlock, ...stats },
  });

  // Replace transactions
  await prisma.cachedTransaction.deleteMany({ where: { walletId: address } });

  for (let i = 0; i < mappedTxs.length; i += 100) {
    const chunk = mappedTxs.slice(i, i + 100);
    await prisma.cachedTransaction.createMany({
      data: chunk.map((tx) => ({
        hash: tx.hash,
        walletId: address,
        blockNumber: tx.blockNumber,
        timestamp: new Date(tx.timestamp),
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        feeWei: tx.feeWei,
        txType: tx.txType,
        isError: tx.isError,
        methodId: tx.methodId,
        contractName: tx.contractName,
      })),
    });
  }

  // Replace daily activity
  await prisma.dailyActivity.deleteMany({ where: { walletId: address } });
  if (dailyActivity.length > 0) {
    await prisma.dailyActivity.createMany({
      data: dailyActivity.map((d) => ({ ...d, walletId: address })),
    });
  }

  const updated = await prisma.walletCache.findUniqueOrThrow({
    where: { id: address },
    include: { dailyActivity: { orderBy: { date: "asc" } } },
  });
  return buildResponse(address, updated, updated.dailyActivity);
}

function buildResponse(
  address: string,
  cache: {
    lastFetchedAt: Date;
    feesWei: string;
    volumeInWei: string;
    volumeOutWei: string;
    volumeUsd: string;
    txCount: number;
    txCountSent: number;
    txCountReceived: number;
    txCountContract: number;
    uniqueContracts: number;
    activeWeeks: number;
    activeMonths: number;
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
    firstTxAt: Date | null;
    lastTxAt: Date | null;
  },
  dailyActivity: { date: string; txCount: number; feesWei: string; volumeWei: string }[]
): StatsResponse {
  return {
    address,
    lastUpdatedAt: cache.lastFetchedAt.toISOString(),
    stats: {
      feesWei: cache.feesWei,
      volumeInWei: cache.volumeInWei,
      volumeOutWei: cache.volumeOutWei,
      volumeUsd: cache.volumeUsd,
      txCount: cache.txCount,
      txCountSent: cache.txCountSent,
      txCountReceived: cache.txCountReceived,
      txCountContract: cache.txCountContract,
      uniqueContracts: cache.uniqueContracts,
      activeWeeks: cache.activeWeeks,
      activeMonths: cache.activeMonths,
      activeDays: cache.activeDays,
      currentStreak: cache.currentStreak,
      longestStreak: cache.longestStreak,
      firstTxAt: cache.firstTxAt?.toISOString() ?? null,
      lastTxAt: cache.lastTxAt?.toISOString() ?? null,
    },
    dailyActivity,
  };
}
