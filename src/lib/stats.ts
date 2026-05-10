import { format, subDays, startOfDay } from "date-fns";
import type { BlockscoutTx, BlockscoutTokenTransfer } from "@/types/blockscout";
import type { WalletStats, DailyActivityPoint } from "@/types/stats";

type TxType = "sent" | "received" | "contract_call";

function classifyTx(tx: BlockscoutTx, address: string): TxType {
  const from = tx.from.hash.toLowerCase();
  const addr = address.toLowerCase();
  if (from !== addr) return "received";
  if (!tx.raw_input || tx.raw_input === "0x") return "sent";
  return "contract_call";
}

function txFeeWei(tx: BlockscoutTx): bigint {
  const gasUsed = BigInt(tx.gas_used ?? "0");
  const gasPrice = BigInt(tx.gas_price ?? "0");
  return gasUsed * gasPrice;
}

export function computeStats(
  address: string,
  txs: BlockscoutTx[],
  tokenTransfers: BlockscoutTokenTransfer[] = [],
  ethPrice = 0
): { stats: WalletStats; dailyActivity: DailyActivityPoint[] } {
  const addr = address.toLowerCase();

  let feesWei = BigInt(0);
  let volumeInWei = BigInt(0);
  let volumeOutWei = BigInt(0);
  let txCountSent = 0;
  let txCountReceived = 0;
  let txCountContract = 0;

  const activeDateSet = new Set<string>();
  const activeWeekSet = new Set<string>();
  const activeMonthSet = new Set<string>();
  const uniqueContractSet = new Set<string>();
  const dailyMap = new Map<string, { txCount: number; feesWei: bigint; volumeWei: bigint }>();

  let firstTxAt: Date | null = null;
  let lastTxAt: Date | null = null;
  let maxBlockSeen = 0;

  for (const tx of txs) {
    const txType = classifyTx(tx, addr);
    const fee = txFeeWei(tx);
    const value = BigInt(tx.value ?? "0");
    const date = format(new Date(tx.timestamp), "yyyy-MM-dd");
    const ts = new Date(tx.timestamp);

    activeDateSet.add(date);
    activeWeekSet.add(format(ts, "yyyy-'W'ww"));
    activeMonthSet.add(format(ts, "yyyy-MM"));
    if (txType === "contract_call" && tx.to?.hash) {
      uniqueContractSet.add(tx.to.hash.toLowerCase());
    }

    if (!firstTxAt || ts < firstTxAt) firstTxAt = ts;
    if (!lastTxAt || ts > lastTxAt) lastTxAt = ts;
    if ((tx.block_number ?? 0) > maxBlockSeen) maxBlockSeen = tx.block_number ?? 0;

    if (txType === "sent") {
      txCountSent++;
      feesWei = feesWei + fee;
      volumeOutWei = volumeOutWei + value;
    } else if (txType === "received") {
      txCountReceived++;
      volumeInWei = volumeInWei + value;
    } else {
      txCountContract++;
      feesWei = feesWei + fee;
      volumeOutWei = volumeOutWei + value;
    }

    const day = dailyMap.get(date) ?? { txCount: 0, feesWei: BigInt(0), volumeWei: BigInt(0) };
    day.txCount++;
    if (txType !== "received") day.feesWei = day.feesWei + fee;
    day.volumeWei = day.volumeWei + value;
    dailyMap.set(date, day);
  }

  // USD volume: outgoing native ETH + outgoing token transfers with known price
  let volumeUsd = 0;
  if (ethPrice > 0) {
    volumeUsd += (Number(BigInt(volumeOutWei)) / 1e18) * ethPrice;
  }
  for (const tf of tokenTransfers) {
    if (tf.from.hash.toLowerCase() !== addr) continue;
    const rate = parseFloat(tf.token.exchange_rate ?? "0");
    const decimals = parseInt(tf.token.decimals ?? "18", 10);
    if (rate <= 0 || isNaN(decimals)) continue;
    const amount = Number(BigInt(tf.total.value)) / Math.pow(10, decimals);
    volumeUsd += amount * rate;
  }

  const currentStreak = computeStreak(activeDateSet);
  const longestStreak = computeLongestStreak(activeDateSet);

  const dailyActivity: DailyActivityPoint[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      txCount: d.txCount,
      feesWei: d.feesWei.toString(),
      volumeWei: d.volumeWei.toString(),
    }));

  const stats: WalletStats = {
    feesWei: feesWei.toString(),
    volumeInWei: volumeInWei.toString(),
    volumeOutWei: volumeOutWei.toString(),
    volumeUsd: volumeUsd.toFixed(2),
    txCount: txs.length,
    txCountSent,
    txCountReceived,
    txCountContract,
    uniqueContracts: uniqueContractSet.size,
    activeDays: activeDateSet.size,
    activeWeeks: activeWeekSet.size,
    activeMonths: activeMonthSet.size,
    currentStreak,
    longestStreak,
    firstTxAt: firstTxAt?.toISOString() ?? null,
    lastTxAt: lastTxAt?.toISOString() ?? null,
  };

  return { stats, dailyActivity };
}

function computeStreak(dateSet: Set<string>): number {
  let streak = 0;
  let cursor = startOfDay(new Date());
  while (dateSet.has(format(cursor, "yyyy-MM-dd"))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

function computeLongestStreak(dateSet: Set<string>): number {
  if (dateSet.size === 0) return 0;
  const sorted = Array.from(dateSet).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export function classifyAndMapTx(tx: BlockscoutTx, address: string) {
  const txType = classifyTx(tx, address);
  const fee = txFeeWei(tx);
  return {
    hash: tx.hash,
    blockNumber: tx.block_number ?? 0,
    timestamp: tx.timestamp,
    fromAddress: tx.from.hash.toLowerCase(),
    toAddress: tx.to?.hash.toLowerCase() ?? null,
    value: tx.value ?? "0",
    gasUsed: tx.gas_used ?? "0",
    gasPrice: tx.gas_price ?? "0",
    feeWei: fee.toString(),
    txType,
    isError: tx.status === "error",
    methodId: tx.decoded_input?.method_id ?? null,
    contractName: tx.to?.name ?? null,
  };
}
