import { NextResponse } from "next/server";
import { isValidAddress } from "@/lib/utils";
import type { BlockscoutTokenHolding } from "@/types/blockscout";

const BASE = "https://megaeth.blockscout.com/api/v2";

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  amount: number;
  usdValue: number | null;
  exchangeRate: number | null;
}

export interface BalanceResponse {
  ethBalance: string;
  ethUsd: number;
  tokens: TokenBalance[];
  totalUsd: number;
}

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();
  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const [addrData, ethPrice, tokenData] = await Promise.all([
      fetch(`${BASE}/addresses/${address}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`${BASE}/stats`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => parseFloat(d.coin_price ?? "0"))
        .catch(() => 0),
      fetchAllTokenHoldings(address),
    ]);

    const coinBalanceWei: string = addrData.coin_balance ?? "0";
    const ethAmount = Number(BigInt(coinBalanceWei)) / 1e18;
    const ethUsd = ethAmount * ethPrice;

    const tokens: TokenBalance[] = tokenData
      .map((h) => {
        const decimals = parseInt(h.token.decimals ?? "18", 10);
        const amount = Number(BigInt(h.value)) / Math.pow(10, decimals);
        const rate = parseFloat(h.token.exchange_rate ?? "0");
        return {
          symbol: h.token.symbol,
          name: h.token.name,
          address: (h.token.address_hash ?? h.token.address ?? "").toLowerCase(),
          amount,
          usdValue: rate > 0 ? amount * rate : null,
          exchangeRate: rate > 0 ? rate : null,
        };
      })
      .filter((t) => t.amount > 0);

    // Fallback: fetch missing prices from DexScreener
    const missing = tokens.filter((t) => t.usdValue === null && t.address);
    if (missing.length > 0) {
      const addrs = missing.map((t) => t.address).join(",");
      try {
        const ds = await fetch(
          `https://api.dexscreener.com/tokens/v1/megaeth/${addrs}`,
          { cache: "no-store", signal: AbortSignal.timeout(3000) }
        ).then((r) => r.json());
        const priceMap: Record<string, number> = {};
        if (Array.isArray(ds)) {
          for (const pair of ds) {
            const addr = (pair.baseToken?.address ?? "").toLowerCase();
            const price = parseFloat(pair.priceUsd ?? "0");
            if (addr && price > 0 && !priceMap[addr]) priceMap[addr] = price;
          }
        }
        for (const token of tokens) {
          if (token.usdValue === null && priceMap[token.address]) {
            token.exchangeRate = priceMap[token.address];
            token.usdValue = token.amount * priceMap[token.address];
          }
        }
      } catch { /* DexScreener unavailable — keep null */ }
    }

    tokens.sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

    const tokenUsd = tokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);

    return NextResponse.json({
      ethBalance: coinBalanceWei,
      ethUsd,
      tokens,
      totalUsd: ethUsd + tokenUsd,
    } satisfies BalanceResponse);
  } catch {
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}

async function fetchAllTokenHoldings(address: string): Promise<BlockscoutTokenHolding[]> {
  const all: BlockscoutTokenHolding[] = [];
  let params: Record<string, string> = {};

  for (let page = 0; page < 10; page++) {
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE}/addresses/${address}/tokens${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    all.push(...(data.items ?? []));
    if (!data.next_page_params) break;
    params = Object.fromEntries(
      Object.entries(data.next_page_params).map(([k, v]) => [k, String(v)])
    );
  }

  return all;
}
