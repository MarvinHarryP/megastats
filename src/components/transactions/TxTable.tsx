"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TxTypeBadge } from "./TxTypeBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { formatAddress, formatEth } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "All", value: "all" },
  { label: "Sent", value: "sent" },
  { label: "Received", value: "received" },
  { label: "Contracts", value: "contract_call" },
];

interface TxTableProps {
  address: string;
}

export function TxTable({ address }: TxTableProps) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("all");
  const { data, isLoading } = useTransactions(address, page, type);

  const handleTabChange = (t: string) => {
    setType(t);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">Transaction History</CardTitle>
          <div className="flex gap-1 flex-wrap">
            {TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={type === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange(tab.value)}
                className="text-xs h-7 px-3"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tx Hash</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">From/To</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Value</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Fee</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Age</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.transactions.map((tx) => (
                    <tr
                      key={tx.hash}
                      className={cn(
                        "border-b hover:bg-muted/30 transition-colors",
                        tx.isError && "opacity-50"
                      )}
                    >
                      <td className="px-4 py-3 font-mono">
                        <a
                          href={`https://megaeth.blockscout.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          {formatAddress(tx.hash, 8)}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <TxTypeBadge type={tx.txType} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                        {tx.txType === "received"
                          ? formatAddress(tx.fromAddress)
                          : formatAddress(tx.toAddress ?? "")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {formatEth(tx.value, 4)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                        {formatEth(tx.feeWei, 6)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              {data.total.toLocaleString()} total · page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
