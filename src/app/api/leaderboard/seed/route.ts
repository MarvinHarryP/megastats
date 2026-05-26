import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TerminalEntry {
  rank: number;
  displayName?: string;
  xAccount?: string;      // Twitter handle if displayName looks like one
  address?: string;       // real wallet address if present in payload
  totalPoints: number;
  weeklyPoints: number;
}

function looksLikeAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/i.test(s);
}

function looksLikeTruncated(s: string): boolean {
  // e.g. "0xa55c...C55d"
  return /^0x[a-fA-F0-9]{4}\.\.\./.test(s);
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

  // --- Try old format first: has mainWalletAddress ---
  const oldRegex = /"rank":(\d+)(?:,"xAccount":"([^"]*)")?,"mainWalletAddress":"(0x[a-fA-F0-9]{40})","totalPoints":(\d+),"weeklyPointsChange":(\d+)/g;
  let match;
  while ((match = oldRegex.exec(text)) !== null) {
    const addr = match[3].toLowerCase();
    entries.push({
      rank: parseInt(match[1]),
      xAccount: match[2] || undefined,
      address: addr,
      totalPoints: parseInt(match[4]),
      weeklyPoints: parseInt(match[5] ?? "0"),
    });
  }

  if (entries.length > 0) return entries;

  // --- New format: {rank, totalPoints, weeklyPointsChange, displayName} ---
  // Parse line-by-line looking for JSON objects with rank + totalPoints
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[{")) continue;

    // Extract all JSON-like objects from this line
    const objMatches = trimmed.matchAll(/\{[^{}]+\}/g);
    for (const om of objMatches) {
      try {
        const obj = JSON.parse(om[0]);
        if (
          typeof obj.rank === "number" &&
          typeof obj.totalPoints === "number"
        ) {
          const weeklyPoints = obj.weeklyPointsChange ?? obj.weeklyPoints ?? 0;
          const dn: string | undefined = obj.displayName ?? obj.xAccount;
          const isRealAddr = dn && looksLikeAddress(dn);
          const isTruncated = dn && looksLikeTruncated(dn);
          const dnLower = dn?.toLowerCase();
          entries.push({
            rank: obj.rank,
            displayName: dnLower,
            xAccount: dnLower && !isRealAddr && !isTruncated ? dnLower : undefined,
            address: isRealAddr ? dn!.toLowerCase() : undefined,
            totalPoints: obj.totalPoints,
            weeklyPoints,
          });
        }
      } catch {
        // not valid JSON object
      }
    }
  }

  // Fallback: regex scan for new compact format
  if (entries.length === 0) {
    const newRegex = /"rank":(\d+),"totalPoints":(\d+),"weeklyPointsChange":(\d+)(?:,"displayName":"([^"]*)")?/g;
    while ((match = newRegex.exec(text)) !== null) {
      const dn = match[4];
      const isRealAddr = dn && looksLikeAddress(dn);
      const isTruncated = dn && looksLikeTruncated(dn);
      const dnLower2 = dn?.toLowerCase();
      entries.push({
        rank: parseInt(match[1]),
        displayName: dnLower2,
        xAccount: dnLower2 && !isRealAddr && !isTruncated ? dnLower2 : undefined,
        address: isRealAddr ? dn.toLowerCase() : undefined,
        totalPoints: parseInt(match[2]),
        weeklyPoints: parseInt(match[3] ?? "0"),
      });
    }
  }

  return entries;
}

const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;

async function runSeed(secret: string | null, force = false) {
  if (secret !== (process.env.SEED_SECRET ?? "megastats-seed")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Skip if seeded less than 23 hours ago (unless force=true)
  if (!force) {
    const latest = await prisma.leaderboardEntry.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (latest && Date.now() - latest.updatedAt.getTime() < TWENTY_THREE_HOURS) {
      return NextResponse.json({ skipped: true, reason: "seeded recently" });
    }
  }

  try {
    const entries = await fetchLeaderboard();
    if (entries.length === 0) {
      return NextResponse.json({ error: "No entries parsed from Terminal" }, { status: 502 });
    }

    // Deduplicate by effective address key
    const seen = new Set<string>();
    const unique = entries.filter((e) => {
      const key = e.address ?? `terminal:rank:${e.rank}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Upsert in batches of 100
    const CHUNK = 100;
    for (let i = 0; i < unique.length; i += CHUNK) {
      await Promise.all(
        unique.slice(i, i + CHUNK).map((e) => {
          const key = e.address ?? `terminal:rank:${e.rank}`;
          return prisma.leaderboardEntry.upsert({
            where: { address: key },
            update: {
              displayName: e.displayName,
              xAccount: e.xAccount,
              totalPoints: e.totalPoints,
              weeklyPoints: e.weeklyPoints,
              rank: e.rank,
            },
            create: {
              address: key,
              displayName: e.displayName,
              xAccount: e.xAccount,
              totalPoints: e.totalPoints,
              weeklyPoints: e.weeklyPoints,
              rank: e.rank,
            },
          });
        })
      );
    }

    const withAddress = unique.filter((e) => e.address).length;
    return NextResponse.json({ seeded: unique.length, withAddress });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: manual trigger / background auto-seed
export async function POST(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  return runSeed(req.headers.get("x-seed-secret"), force);
}

// GET: cron trigger
export async function GET(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  const auth = req.headers.get("authorization") ?? "";
  const secret = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers.get("x-seed-secret");
  return runSeed(secret, force);
}
