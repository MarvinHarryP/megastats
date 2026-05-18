import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClusterAuth } from "@/lib/cluster-auth";
import { verifyMessage } from "viem";
import { randomBytes } from "crypto";

const FIVE_MINUTES = 5 * 60 * 1000;
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// GET /api/cluster/[address] — public
export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();

  const cluster = await prisma.walletCluster.findUnique({
    where: { address },
    include: { members: true },
  });

  if (!cluster) return NextResponse.json({ cluster: null });

  const memberAddresses = cluster.members.map((m) => m.memberAddress);
  const allAddresses = [address, ...memberAddresses];

  const [wallets, leaderboardEntries] = await Promise.all([
    prisma.walletCache.findMany({
      where: { id: { in: allAddresses } },
      select: { id: true, txCount: true, volumeUsd: true, activeDays: true, currentStreak: true },
    }),
    prisma.leaderboardEntry.findMany({
      where: { address: { in: allAddresses } },
      select: { address: true, totalPoints: true, weeklyPoints: true, rank: true, xAccount: true },
    }),
  ]);

  const walletMap = new Map(wallets.map((w) => [w.id, w]));
  const leaderboardMap = new Map(leaderboardEntries.map((e) => [e.address, e]));

  const enrich = (addr: string) => {
    const w = walletMap.get(addr);
    const lb = leaderboardMap.get(addr);
    return {
      txCount: w?.txCount ?? null,
      volumeUsd: w?.volumeUsd ?? null,
      activeDays: w?.activeDays ?? null,
      currentStreak: w?.currentStreak ?? null,
      terminalPoints: lb?.totalPoints ?? null,
      weeklyPoints: lb?.weeklyPoints ?? null,
      xAccount: lb?.xAccount ?? null,
    };
  };

  const enrichedMembers = cluster.members.map((m) => ({ ...m, ...enrich(m.memberAddress) }));
  const mainStats = enrich(address);
  const allStats = [mainStats, ...enrichedMembers];

  const aggregated = {
    totalTxs: allStats.reduce((s, w) => s + (w.txCount ?? 0), 0),
    totalVolume: allStats.reduce((s, w) => s + parseFloat(w.volumeUsd ?? "0"), 0),
    totalTerminalPoints: allStats.reduce((s, w) => s + (w.terminalPoints ?? 0), 0),
    totalWeeklyPoints: allStats.reduce((s, w) => s + (w.weeklyPoints ?? 0), 0),
  };

  return NextResponse.json({
    cluster: {
      ...cluster,
      sessionToken: undefined, // never expose token to client
      members: enrichedMembers,
      mainWallet: mainStats,
      aggregated,
    },
  });
}

// POST /api/cluster/[address] — create cluster (always requires signature, returns session token)
export async function POST(
  req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase() as `0x${string}`;

  let body: { signature: string; timestamp: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { signature, timestamp } = body;
  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing signature or timestamp" }, { status: 400 });
  }
  if (Date.now() - timestamp > FIVE_MINUTES) {
    return NextResponse.json({ error: "Signature expired" }, { status: 400 });
  }

  const message = `MegaStats cluster: ${address} — ${timestamp}`;
  try {
    const valid = await verifyMessage({ address, message, signature: signature as `0x${string}` });
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }

  const sessionToken = randomBytes(32).toString("hex");
  const sessionExpiry = new Date(Date.now() + SESSION_DURATION);

  const cluster = await prisma.walletCluster.upsert({
    where: { address },
    update: { sessionToken, sessionExpiry },
    create: { address, sessionToken, sessionExpiry },
    include: { members: true },
  });

  return NextResponse.json({ cluster: { ...cluster, sessionToken }, sessionToken });
}
