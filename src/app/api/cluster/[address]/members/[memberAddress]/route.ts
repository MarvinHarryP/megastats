import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClusterAuth, type AuthPayload } from "@/lib/cluster-auth";

// DELETE /api/cluster/[address]/members/[memberAddress]
export async function DELETE(
  req: Request,
  { params }: { params: { address: string; memberAddress: string } }
) {
  try {
    const clusterAddress = params.address.toLowerCase() as `0x${string}`;
    const memberAddress = params.memberAddress.toLowerCase();

    let body: AuthPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const auth = await verifyClusterAuth(clusterAddress, body);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
      await prisma.walletClusterMember.delete({
        where: { clusterAddress_memberAddress: { clusterAddress, memberAddress } },
      });
    } catch {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, sessionToken: auth.sessionToken });
  } catch (e) {
    console.error("DELETE /members/[memberAddress] error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
