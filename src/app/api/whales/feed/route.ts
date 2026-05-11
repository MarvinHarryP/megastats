import { NextResponse } from "next/server";

const BLOCKSCOUT = "https://megaeth.blockscout.com/api/v2";

export interface WhaleTx {
  hash: string;
  from: string;
  to: string | null;
  usdValue: number;
  ethValue: number;
  timestamp: string;
  method: string | null;
  tokenTransfers: {
    symbol: string;
    amount: number;
    usdValue: number;
  }[];
}

async function getEthPrice(): Promise<number> {
  try {
    const res = await fetch(`${BLOCKSCOUT}/stats`, { next: { revalidate: 60 } });
    const data = await res.json();
    return parseFloat(data.coin_price ?? "0");
  } catch {
    return 0;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const min = parseFloat(searchParams.get("min") ?? "1000");

  try {
    const [txRes, ethPrice] = await Promise.all([
      fetch(
        `${BLOCKSCOUT}/transactions?filter=validated&limit=50`,
        { next: { revalidate: 5 } }
      ),
      getEthPrice(),
    ]);

    const txData = await txRes.json();
    const rawTxs: Record<string, unknown>[] = txData.items ?? [];

    const results: WhaleTx[] = [];

    for (const tx of rawTxs) {
      // ETH value
      const weiStr = String(tx.value ?? "0").replace(/[^0-9]/g, "");
      const ethValue = weiStr ? Number(BigInt(weiStr)) / 1e18 : 0;
      const ethUsd = ethValue * ethPrice;

      // Token transfers
      const transfers: WhaleTx["tokenTransfers"] = [];
      const rawTransfers = Array.isArray(tx.token_transfers) ? tx.token_transfers as Record<string, unknown>[] : [];
      for (const t of rawTransfers) {
        const token = t.token as Record<string, unknown> | undefined;
        const total = t.total as Record<string, unknown> | undefined;
        if (!token || !total) continue;
        const decimals = parseInt(String(token.decimals ?? "18"), 10);
        const rawAmt = String(total.value ?? "0").replace(/[^0-9]/g, "");
        const amount = rawAmt ? Number(BigInt(rawAmt)) / Math.pow(10, decimals) : 0;
        const rate = parseFloat(String(token.exchange_rate ?? "0"));
        const usdValue = amount * rate;
        if (amount > 0 && rate > 0) {
          transfers.push({
            symbol: String(token.symbol ?? "?"),
            amount,
            usdValue,
          });
        }
      }

      const tokenUsd = transfers.reduce((s, t) => s + t.usdValue, 0);
      const usdValue = ethUsd + tokenUsd;

      if (usdValue < min) continue;

      const decodedInput = tx.decoded_input as Record<string, unknown> | null | undefined;
      const method = decodedInput?.method_call
        ? String(decodedInput.method_call).split("(")[0]
        : (tx.method ? String(tx.method) : null);

      results.push({
        hash: String(tx.hash ?? ""),
        from: String(tx.from && typeof tx.from === "object" ? (tx.from as Record<string, unknown>).hash ?? "" : ""),
        to: tx.to && typeof tx.to === "object" ? String((tx.to as Record<string, unknown>).hash ?? "") || null : null,
        usdValue,
        ethValue,
        timestamp: String(tx.timestamp ?? new Date().toISOString()),
        method,
        tokenTransfers: transfers,
      });
    }

    // Sort by USD value descending
    results.sort((a, b) => b.usdValue - a.usdValue);

    return NextResponse.json({ txs: results, ethPrice });
  } catch (e) {
    console.error("[whales/feed]", e);
    return NextResponse.json({ txs: [], ethPrice: 0 });
  }
}
