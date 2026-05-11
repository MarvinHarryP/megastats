import { lookupProtocol } from "@/lib/defi-registry";
import type { BlockscoutTokenHolding } from "@/types/blockscout";

const BASE = "https://megaeth.blockscout.com/api/v2";
const USDM_ADDRESS = "0xfafddbb3fc7688494971a79cc65dca3ef82079e7";

export interface DeFiPosition {
  protocol: string;
  type: string;
  icon: string;
  color: string;
  url?: string;
  symbol: string;
  name: string;
  address: string;
  amount: number;
  usdValue: number | null;
}

export async function fetchDefiPositions(address: string): Promise<DeFiPosition[]> {
  const [holdings, usdmPrice] = await Promise.all([
    fetchAllTokenHoldings(address),
    fetchUsdmPrice(),
  ]);

  const ethPrice = await fetchEthPrice();
  const positions: DeFiPosition[] = [];

  for (const h of holdings) {
    const tokenAddress = (h.token.address_hash ?? h.token.address ?? "").toLowerCase();
    const info = lookupProtocol(tokenAddress, h.token.symbol, h.token.name);
    if (!info) continue;

    let amount = 0;
    try {
      const decimals = parseInt(h.token.decimals ?? "18", 10);
      const raw = h.value?.replace(/[^0-9]/g, "") || "0";
      amount = Number(BigInt(raw)) / Math.pow(10, decimals);
    } catch {
      continue;
    }
    if (amount <= 0) continue;

    let usdValue: number | null = null;
    const rate = parseFloat(h.token.exchange_rate ?? "0");
    if (rate > 0) {
      usdValue = amount * rate;
    } else if (info.priceHint === "usdm" && usdmPrice > 0) {
      usdValue = amount * usdmPrice;
    } else if (info.priceHint === "eth" && ethPrice > 0) {
      usdValue = amount * ethPrice;
    }

    positions.push({
      protocol: info.protocol,
      type: info.type,
      icon: info.icon,
      color: info.color,
      url: info.url,
      symbol: h.token.symbol,
      name: h.token.name,
      address: tokenAddress,
      amount,
      usdValue,
    });
  }

  positions.sort((a, b) => (b.usdValue ?? -1) - (a.usdValue ?? -1));
  return positions;
}

async function fetchUsdmPrice(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/tokens/${USDM_ADDRESS}`, { next: { revalidate: 300 } });
    const data = await res.json();
    return parseFloat(data.exchange_rate ?? "0");
  } catch {
    return 0.999;
  }
}

async function fetchEthPrice(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/stats`, { next: { revalidate: 300 } });
    const data = await res.json();
    return parseFloat(data.coin_price ?? "0");
  } catch {
    return 0;
  }
}

async function fetchAllTokenHoldings(address: string): Promise<BlockscoutTokenHolding[]> {
  const all: BlockscoutTokenHolding[] = [];
  let params: Record<string, string> = {};

  for (let page = 0; page < 5; page++) {
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE}/addresses/${address}/tokens?type=ERC-20${qs ? `&${qs}` : ""}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();
    all.push(...(data.items ?? []));
    if (!data.next_page_params) break;
    params = Object.fromEntries(
      Object.entries(data.next_page_params).map(([k, v]) => [k, String(v)])
    );
  }

  return all;
}
