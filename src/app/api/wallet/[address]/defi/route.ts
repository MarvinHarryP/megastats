import { NextResponse } from "next/server";
import { isValidAddress } from "@/lib/utils";
import { lookupProtocol } from "@/lib/defi-registry";
import type { BlockscoutTokenHolding } from "@/types/blockscout";

const BASE = "https://megaeth.blockscout.com/api/v2";

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

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();

  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const holdings = await fetchAllTokenHoldings(address);

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

      const rate = parseFloat(h.token.exchange_rate ?? "0");
      const usdValue = rate > 0 ? amount * rate : null;

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

    // Sort by USD value desc, unknowns last
    positions.sort((a, b) => (b.usdValue ?? -1) - (a.usdValue ?? -1));

    return NextResponse.json({ positions, total: positions.length });
  } catch {
    return NextResponse.json({ positions: [], total: 0 });
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
