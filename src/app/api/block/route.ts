import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://mainnet.megaeth.com/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      next: { revalidate: 5 },
    });
    const data = await res.json();
    const blockNumber = parseInt(data.result, 16);
    return NextResponse.json({ blockNumber, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ blockNumber: 0, timestamp: Date.now() });
  }
}
