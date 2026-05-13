import { NextResponse } from "next/server";

const MEGA_ADDRESS = "0x28B7E77f82B25B95953825F1E3eA0E36c1c29861";

export const revalidate = 300; // cache 5 min

export async function GET() {
  try {
    // Try DexScreener first
    const res = await fetch(
      `https://api.dexscreener.com/tokens/v1/megaeth/${MEGA_ADDRESS}`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const data = await res.json();
      const pairs = data?.pairs ?? data;
      const pair = Array.isArray(pairs) ? pairs[0] : null;
      const price = parseFloat(pair?.priceUsd ?? "0");
      if (price > 0) return NextResponse.json({ price });
    }
  } catch { /* fallthrough */ }

  try {
    // Fallback: Blockscout token info
    const res = await fetch(
      `https://megaeth.blockscout.com/api/v2/tokens/${MEGA_ADDRESS}`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const data = await res.json();
      const price = parseFloat(data?.exchange_rate ?? "0");
      if (price > 0) return NextResponse.json({ price });
    }
  } catch { /* fallthrough */ }

  return NextResponse.json({ price: null });
}
