"use client";

import { useQuery } from "@tanstack/react-query";
import type { TxResponse } from "@/types/stats";

export function useTransactions(address: string, page: number, type: string) {
  return useQuery<TxResponse>({
    queryKey: ["transactions", address, page, type],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        type,
      });
      const res = await fetch(`/api/wallet/${address}/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
