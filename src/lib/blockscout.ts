import type {
  BlockscoutTx,
  BlockscoutTxResponse,
  BlockscoutTokenTransfer,
  BlockscoutTokenTransferResponse,
} from "@/types/blockscout";

const BASE = "https://megaeth.blockscout.com/api/v2";
const MAX_TXS = 2500; // fetch last 2500 txs max — real total comes from address endpoint
const REQUEST_TIMEOUT_MS = 8000;

export async function fetchAllTransactions(address: string): Promise<BlockscoutTx[]> {
  const all: BlockscoutTx[] = [];
  let nextPageParams: Record<string, string | number> | null = null;

  do {
    const url = new URL(`${BASE}/addresses/${address}/transactions`);
    if (nextPageParams) {
      for (const [k, v] of Object.entries(nextPageParams)) {
        url.searchParams.set(k, String(v));
      }
    }

    try {
      const res = await fetch(url.toString(), {
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) break;
      const data: BlockscoutTxResponse = await res.json();
      all.push(...data.items);
      nextPageParams = data.next_page_params ?? null;
    } catch {
      break; // timeout or network error — return what we have so far
    }

    if (all.length >= MAX_TXS) break;
    if (nextPageParams) await new Promise((r) => setTimeout(r, 80));
  } while (nextPageParams !== null);

  return all;
}

export async function fetchAllTokenTransfers(
  address: string
): Promise<BlockscoutTokenTransfer[]> {
  const all: BlockscoutTokenTransfer[] = [];
  let nextPageParams: Record<string, string | number> | null = null;

  do {
    const url = new URL(`${BASE}/addresses/${address}/token-transfers`);
    if (nextPageParams) {
      for (const [k, v] of Object.entries(nextPageParams)) {
        url.searchParams.set(k, String(v));
      }
    }

    try {
      const res = await fetch(url.toString(), {
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) break;
      const data: BlockscoutTokenTransferResponse = await res.json();
      if (!data.items) break;
      all.push(...data.items);
      nextPageParams = data.next_page_params ?? null;
    } catch {
      break; // timeout or network error — return what we have so far
    }

    if (all.length >= MAX_TXS) break;
    if (nextPageParams) await new Promise((r) => setTimeout(r, 80));
  } while (nextPageParams !== null);

  return all;
}

export async function fetchNewTransactions(
  address: string,
  sinceBlock: number
): Promise<BlockscoutTx[]> {
  const collected: BlockscoutTx[] = [];
  let nextPageParams: Record<string, string | number> | null = null;

  do {
    const url = new URL(`${BASE}/addresses/${address}/transactions`);
    if (nextPageParams) {
      for (const [k, v] of Object.entries(nextPageParams)) {
        url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) break;

    const data: BlockscoutTxResponse = await res.json();
    const newItems = data.items.filter((tx) => (tx.block_number ?? 0) > sinceBlock);
    collected.push(...newItems);

    if (newItems.length < data.items.length) break;
    nextPageParams = data.next_page_params ?? null;
    if (nextPageParams) await new Promise((r) => setTimeout(r, 80));
  } while (nextPageParams !== null);

  return collected;
}
