"use client";

import { RefreshButton } from "@/components/shared/RefreshButton";

interface Props {
  address: string;
  lastUpdatedAt: string;
}

export function DashboardClient({ address, lastUpdatedAt }: Props) {
  return <RefreshButton address={address} lastUpdatedAt={lastUpdatedAt} />;
}
