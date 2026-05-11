import type { WhaleTx } from "@/app/api/whales/feed/route";

const BLOCKSCOUT = "https://megaeth.blockscout.com/api/v2";

export async function fetchWhaleTxs(min = 1000): Promise<WhaleTx[]> {
  try {
    const res = await fetch(
      `${BLOCKSCOUT}/token-transfers?limit=100`,
      { cache: "no-store" }
    );
    const data = await res.json();
    const items: Record<string, unknown>[] = data.items ?? [];

    const txMap = new Map<string, WhaleTx>();

    for (const item of items) {
      const hash = String(item.transaction_hash ?? "");
      if (!hash) continue;

      const token = item.token as Record<string, unknown> | null;
      const total = item.total as Record<string, unknown> | null;
      if (!token || !total) continue;

      const decimals = parseInt(String(token.decimals ?? "18"), 10);
      const rawAmt = String(total.value ?? "0").replace(/[^0-9]/g, "");
      const amount = rawAmt ? Number(BigInt(rawAmt)) / Math.pow(10, decimals) : 0;
      const rate = parseFloat(String(token.exchange_rate ?? "0"));
      const usdValue = amount * rate;
      if (amount <= 0 || rate <= 0) continue;

      const fromObj = item.from as Record<string, unknown> | null;
      const toObj = item.to as Record<string, unknown> | null;
      const from = String(fromObj?.hash ?? "").toLowerCase();
      const to = toObj?.hash ? String(toObj.hash).toLowerCase() : null;
      const timestamp = String(item.timestamp ?? new Date().toISOString());
      const method = item.method && !String(item.method).startsWith("0x")
        ? String(item.method) : null;

      if (!txMap.has(hash)) {
        txMap.set(hash, { hash, from, to, usdValue: 0, ethValue: 0, timestamp, method, tokenTransfers: [] });
      }
      const tx = txMap.get(hash)!;
      tx.usdValue += usdValue;
      tx.tokenTransfers.push({ symbol: String(token.symbol ?? "?"), amount, usdValue });
    }

    return Array.from(txMap.values())
      .filter((tx) => tx.usdValue >= min)
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 50);
  } catch {
    return [];
  }
}
