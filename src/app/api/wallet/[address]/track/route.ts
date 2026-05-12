import { NextResponse } from "next/server";
import { isValidAddress } from "@/lib/utils";
import { getOrSyncWallet } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();
  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  try {
    await getOrSyncWallet(address);
    // Mark as explicitly tracked in the leaderboard
    await prisma.leaderboardEntry.updateMany({
      where: { address },
      data: { isTracked: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
