import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TerminalEntry {
  rank: number;
  xAccount?: string;
  mainWalletAddress: string;
  totalPoints: number;
  weeklyPoints: number;
}

async function fetchLeaderboard(): Promise<TerminalEntry[]> {
  const res = await fetch("https://terminal.megaeth.com/leaderboard", {
    headers: {
      "RSC": "1",
      "Accept": "text/x-component",
      "Next-Router-State-Tree": "%5B%22%22%2C%7B%22children%22%3A%5B%22(main)%22%2C%7B%22children%22%3A%5B%22leaderboard%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Terminal fetch failed: ${res.status}`);
  const text = await res.text();

  const entries: TerminalEntry[] = [];
  const regex = /"rank":(\d+)(?:,"xAccount":"([^"]*)")?,"mainWalletAddress":"(0x[a-fA-F0-9]{40})","totalPoints":(\d+),"weeklyPointsChange":(\d+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    entries.push({
      rank: parseInt(match[1]),
      xAccount: match[2] || undefined,
      mainWalletAddress: match[3].toLowerCase(),
      totalPoints: parseInt(match[4]),
      weeklyPoints: parseInt(match[5] ?? "0"),
    });
  }

  return entries;
}

const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;

async function runSeed(secret: string | null) {
  if (secret !== (process.env.SEED_SECRET ?? "megastats-seed")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Skip if seeded less than 23 hours ago
  const latest = await prisma.leaderboardEntry.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  if (latest && Date.now() - latest.updatedAt.getTime() < TWENTY_THREE_HOURS) {
    return NextResponse.json({ skipped: true, reason: "seeded recently" });
  }

  try {
    const entries = await fetchLeaderboard();
    if (entries.length === 0) {
      return NextResponse.json({ error: "No entries parsed from Terminal" }, { status: 502 });
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = entries.filter((e) => {
      if (seen.has(e.mainWalletAddress)) return false;
      seen.add(e.mainWalletAddress);
      return true;
    });

    // Upsert in batches
    const CHUNK = 100;
    for (let i = 0; i < unique.length; i += CHUNK) {
      await Promise.all(
        unique.slice(i, i + CHUNK).map((e) =>
          prisma.leaderboardEntry.upsert({
            where: { address: e.mainWalletAddress },
            update: { xAccount: e.xAccount, totalPoints: e.totalPoints, weeklyPoints: e.weeklyPoints, rank: e.rank },
            create: { address: e.mainWalletAddress, xAccount: e.xAccount, totalPoints: e.totalPoints, weeklyPoints: e.weeklyPoints, rank: e.rank },
          })
        )
      );
    }

    return NextResponse.json({ seeded: unique.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: manual trigger
export async function POST(req: Request) {
  return runSeed(req.headers.get("x-seed-secret"));
}

// GET: Vercel cron trigger (passes CRON_SECRET as Authorization header)
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers.get("x-seed-secret");
  return runSeed(secret);
}
