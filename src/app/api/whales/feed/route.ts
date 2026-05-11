import { NextResponse } from "next/server";
import { fetchWhaleTxs } from "@/lib/whale-fetcher";

export interface WhaleTx {
  hash: string;
  from: string;
  to: string | null;
  usdValue: number;
  ethValue: number;
  timestamp: string;
  method: string | null;
  tokenTransfers: { symbol: string; amount: number; usdValue: number }[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const min = parseFloat(searchParams.get("min") ?? "1000");
  const txs = await fetchWhaleTxs(min);
  return NextResponse.json({ txs });
}
