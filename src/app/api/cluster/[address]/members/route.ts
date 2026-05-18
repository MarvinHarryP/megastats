import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClusterAuth, type AuthPayload } from "@/lib/cluster-auth";
import { isAddress } from "viem";
import { getOrSyncWallet } from "@/lib/cache";

// POST /api/cluster/[address]/members — add a member wallet
export async function POST(
  req: Request,
  { params }: { params: { address: string } }
) {
  try {
    const clusterAddress = params.address.toLowerCase() as `0x${string}`;

    let body: { memberAddress: string; label?: string } & AuthPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { memberAddress, label, ...authPayload } = body;

    if (!memberAddress) {
      return NextResponse.json({ error: "Missing memberAddress" }, { status: 400 });
    }
    if (!isAddress(memberAddress)) {
      return NextResponse.json({ error: "Invalid member address" }, { status: 400 });
    }
    if (memberAddress.toLowerCase() === clusterAddress) {
      return NextResponse.json({ error: "Cannot add main wallet as member" }, { status: 400 });
    }

    const auth = await verifyClusterAuth(clusterAddress, authPayload as AuthPayload);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const cluster = await prisma.walletCluster.findUnique({ where: { address: clusterAddress } });
    if (!cluster) {
      return NextResponse.json({ error: "Cluster not found — create it first" }, { status: 404 });
    }

    const normalizedMember = memberAddress.toLowerCase();
    const member = await prisma.walletClusterMember.upsert({
      where: { clusterAddress_memberAddress: { clusterAddress, memberAddress: normalizedMember } },
      update: { label: label ?? null },
      create: { clusterAddress, memberAddress: normalizedMember, label: label ?? null },
    });

    getOrSyncWallet(normalizedMember).catch(() => {});

    return NextResponse.json({ member, sessionToken: auth.sessionToken });
  } catch (e) {
    console.error("POST /members error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
