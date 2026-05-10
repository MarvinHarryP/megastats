"use client";

import { useQuery } from "@tanstack/react-query";
import type { StatsResponse } from "@/types/stats";

export function useWalletStats(address: string, initialData?: StatsResponse) {
  return useQuery<StatsResponse>({
    queryKey: ["wallet", address],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/${address}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    initialData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
