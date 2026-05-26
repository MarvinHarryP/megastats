import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle")?.trim().replace(/^@/, "").toLowerCase();
  const address = searchParams.get("address")?.trim().toLowerCase();

  if (!handle && !address) {
    return NextResponse.json({ error: "Invalid handle or address" }, { status: 400 });
  }

  if (handle && handle.length < 2) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }

  try {
    let entry = null;

    if (address) {
      // Direct address lookup
      entry = await prisma.leaderboardEntry.findFirst({
        where: { address: { equals: address } },
      });
    }

    if (!entry && handle) {
      entry = await prisma.leaderboardEntry.findFirst({
        where: {
          OR: [
            { displayName: { equals: handle } },
            { displayName: { equals: handle.toLowerCase() } },
            { xAccount: { equals: handle } },
            { xAccount: { equals: handle.toLowerCase() } },
          ],
        },
      });
    }

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const agg = await prisma.leaderboardEntry.aggregate({ _sum: { totalPoints: true } });
    const count = await prisma.leaderboardEntry.count();

    return NextResponse.json({
      rank: entry.rank,
      totalPoints: entry.totalPoints,
      weeklyPoints: entry.weeklyPoints,
      xAccount: entry.xAccount ?? entry.displayName,
      totalInLeaderboard: count,
      totalPointsSum: agg._sum.totalPoints ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
