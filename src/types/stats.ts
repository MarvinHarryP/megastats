export interface WalletStats {
  feesWei: string;
  volumeInWei: string;
  volumeOutWei: string;
  volumeUsd: string;
  txCount: number;
  txCountSent: number;
  txCountReceived: number;
  txCountContract: number;
  uniqueContracts: number;
  activeDays: number;
  activeWeeks: number;
  activeMonths: number;
  currentStreak: number;
  longestStreak: number;
  firstTxAt: string | null;
  lastTxAt: string | null;
}

export interface DailyActivityPoint {
  date: string;
  txCount: number;
  feesWei: string;
  volumeWei: string;
}

export interface StatsResponse {
  address: string;
  lastUpdatedAt: string;
  stats: WalletStats;
  dailyActivity: DailyActivityPoint[];
}

export interface TxSummary {
  hash: string;
  blockNumber: number;
  timestamp: string;
  fromAddress: string;
  toAddress: string | null;
  value: string;
  feeWei: string;
  txType: "sent" | "received" | "contract_call";
  isError: boolean;
  methodId: string | null;
  contractName: string | null;
}

export interface TxResponse {
  transactions: TxSummary[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}
