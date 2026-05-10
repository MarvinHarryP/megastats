import { NextRequest, NextResponse } from "next/server";
import { isValidAddress } from "@/lib/utils";
import { forceRefreshWallet } from "@/lib/cache";

export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();
  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address", code: "INVALID_ADDRESS" }, { status: 400 });
  }

  try {
    const data = await forceRefreshWallet(address);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[refresh/route]", err);
    return NextResponse.json({ error: "Refresh failed", code: "API_ERROR" }, { status: 500 });
  }
}
