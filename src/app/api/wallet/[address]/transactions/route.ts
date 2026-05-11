import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAddress } from "@/lib/utils";
import type { TxResponse } from "@/types/stats";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();
  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address", code: "INVALID_ADDRESS" }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25") || 25));
  const type = searchParams.get("type") ?? "all";

  const VALID_TYPES = ["all", "sent", "received", "contract_call"];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type parameter", code: "INVALID_TYPE" }, { status: 400 });
  }

  const where = {
    walletId: address,
    ...(type !== "all" ? { txType: type } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.cachedTransaction.count({ where }),
    prisma.cachedTransaction.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const response: TxResponse = {
    transactions: rows.map((r) => ({
      hash: r.hash,
      blockNumber: r.blockNumber,
      timestamp: r.timestamp.toISOString(),
      fromAddress: r.fromAddress,
      toAddress: r.toAddress,
      value: r.value,
      feeWei: r.feeWei,
      txType: r.txType as "sent" | "received" | "contract_call",
      isError: r.isError,
      methodId: r.methodId,
      contractName: r.contractName,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };

  return NextResponse.json(response);
}
