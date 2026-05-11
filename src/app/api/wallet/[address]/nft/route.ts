import { NextResponse } from "next/server";
import { isValidAddress } from "@/lib/utils";
import type { BlockscoutNFTResponse } from "@/types/blockscout";

const BASE = "https://megaeth.blockscout.com/api/v2";

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();

  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    // Fetch up to 50 NFTs (first page)
    const res = await fetch(
      `${BASE}/addresses/${address}/nft?limit=50`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const data: BlockscoutNFTResponse = await res.json();
    const items = data.items ?? [];

    return NextResponse.json({
      items,
      total: items.length,
      hasMore: data.next_page_params !== null,
    });
  } catch {
    return NextResponse.json({ items: [], total: 0 });
  }
}
