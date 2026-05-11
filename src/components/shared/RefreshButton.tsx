"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  address: string;
  lastUpdatedAt: string;
}

export function RefreshButton({ address, lastUpdatedAt }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/${address}/refresh`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429 && body.retryAfter) {
          const mins = Math.ceil(body.retryAfter / 60);
          toast.error(`Please wait ${mins} minute${mins !== 1 ? "s" : ""} before refreshing.`);
        } else {
          toast.error("Refresh failed. Try again.");
        }
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["wallet", address] });
      await queryClient.invalidateQueries({ queryKey: ["transactions", address] });
      toast.success("Data refreshed");
    } catch {
      toast.error("Refresh failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Updated {formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}
      </span>
      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
        <RefreshCw className={cn("h-3.5 w-3.5 mr-1", loading && "animate-spin")} />
        Refresh
      </Button>
    </div>
  );
}
