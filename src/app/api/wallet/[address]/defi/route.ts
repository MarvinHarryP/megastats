import { NextResponse } from "next/server";
import { isValidAddress } from "@/lib/utils";
import { fetchDefiPositions } from "@/lib/defi-fetcher";

export type { DeFiPosition } from "@/lib/defi-fetcher";

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();

  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const positions = await fetchDefiPositions(address);
    return NextResponse.json({ positions, total: positions.length });
  } catch {
    return NextResponse.json({ positions: [], total: 0 });
  }
}
