export interface BlockscoutTx {
  hash: string;
  block_number: number | null;
  timestamp: string;
  from: { hash: string };
  to: { hash: string; name?: string | null } | null;
  value: string;
  gas_used: string | null;
  gas_price: string | null;
  result: string;
  raw_input: string;
  method?: string | null;
  decoded_input?: { method_id: string } | null;
  status: "ok" | "error";
}

export interface BlockscoutTxResponse {
  items: BlockscoutTx[];
  next_page_params: {
    block_number: number;
    index: number;
    items_count: number;
  } | null;
}

export interface BlockscoutTokenTransfer {
  tx_hash: string;
  timestamp: string;
  from: { hash: string };
  to: { hash: string } | null;
  token: {
    symbol: string;
    decimals: string | null;
    exchange_rate: string | null;
  };
  total: { value: string };
  type: string;
}

export interface BlockscoutTokenTransferResponse {
  items: BlockscoutTokenTransfer[];
  next_page_params: Record<string, string | number> | null;
}

export interface BlockscoutAddress {
  hash: string;
  coin_balance: string | null;
  transaction_count: number;
}
