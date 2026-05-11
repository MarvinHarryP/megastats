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

export interface BlockscoutTokenHolding {
  token: {
    symbol: string;
    name: string;
    decimals: string | null;
    exchange_rate: string | null;
    address?: string;
    address_hash?: string; // actual field returned by Blockscout API
  };
  value: string;
}

export interface BlockscoutTokenHoldingsResponse {
  items: BlockscoutTokenHolding[];
  next_page_params: Record<string, string | number> | null;
}

export interface BlockscoutNFT {
  id: string;
  token: {
    name: string | null;
    address: string;
    type: string;
  };
  image_url: string | null;
  metadata: {
    name?: string;
    image?: string;
    description?: string;
  } | null;
  value?: string;
}

export interface BlockscoutNFTResponse {
  items: BlockscoutNFT[];
  next_page_params: Record<string, string | number> | null;
}
