import { NextRequest, NextResponse } from "next/server";
import { isValidAddress } from "@/lib/utils";
import { forceRefreshWallet } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();
  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address", code: "INVALID_ADDRESS" }, { status: 400 });
  }

  // Cooldown: prevent refresh if last sync was < 5 minutes ago
  const cached = await prisma.walletCache.findUnique({
    where: { id: address },
    select: { lastFetchedAt: true },
  });
  if (cached && Date.now() - cached.lastFetchedAt.getTime() < REFRESH_COOLDOWN_MS) {
    const retryAfter = Math.ceil((REFRESH_COOLDOWN_MS - (Date.now() - cached.lastFetchedAt.getTime())) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please wait before refreshing.", code: "COOLDOWN", retryAfter },
      { status: 429 }
    );
  }

  try {
    const data = await forceRefreshWallet(address);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[refresh/route]", err);
    return NextResponse.json({ error: "Refresh failed", code: "API_ERROR" }, { status: 500 });
  }
}
