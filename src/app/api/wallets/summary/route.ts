import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/wallets/summary
// Body: { addresses: string[] }
// Returns cached stats for multiple wallets at once (no Blockscout calls)

export async function POST(req: Request) {
  try {
    const { addresses } = await req.json();
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ summaries: {} });
    }

    const rows = await prisma.walletCache.findMany({
      where: { id: { in: addresses.map((a: string) => a.toLowerCase()) } },
      select: {
        id: true,
        txCount: true,
        volumeUsd: true,
        activeDays: true,
        lastTxAt: true,
        lastFetchedAt: true,
      },
    });

    const summaries: Record<string, {
      txCount: number;
      volumeUsd: number;
      activeDays: number;
      lastTxAt: string | null;
      lastFetchedAt: string;
    }> = {};

    for (const row of rows) {
      summaries[row.id] = {
        txCount: row.txCount,
        volumeUsd: parseFloat(row.volumeUsd ?? "0"),
        activeDays: row.activeDays,
        lastTxAt: row.lastTxAt?.toISOString() ?? null,
        lastFetchedAt: row.lastFetchedAt.toISOString(),
      };
    }

    return NextResponse.json({ summaries });
  } catch {
    return NextResponse.json({ summaries: {} });
  }
}
