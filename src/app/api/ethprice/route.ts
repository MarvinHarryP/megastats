import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://megaeth.blockscout.com/api/v2/stats", {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    const price = parseFloat(data.coin_price ?? "0");
    return NextResponse.json({ price });
  } catch {
    return NextResponse.json({ price: 0 });
  }
}
