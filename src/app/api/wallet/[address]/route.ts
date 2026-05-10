import { NextRequest, NextResponse } from "next/server";
import { isValidAddress } from "@/lib/utils";
import { getOrSyncWallet } from "@/lib/cache";

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();

  if (!isValidAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Ethereum address", code: "INVALID_ADDRESS" },
      { status: 400 }
    );
  }

  try {
    const data = await getOrSyncWallet(address);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[wallet/route]", err);
    return NextResponse.json(
      { error: "Failed to fetch wallet data", code: "API_ERROR" },
      { status: 500 }
    );
  }
}
