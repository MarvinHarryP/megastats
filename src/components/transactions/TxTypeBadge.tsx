import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Code2 } from "lucide-react";

interface TxTypeBadgeProps {
  type: "sent" | "received" | "contract_call";
}

export function TxTypeBadge({ type }: TxTypeBadgeProps) {
  if (type === "sent") {
    return (
      <Badge variant="destructive" className="gap-1">
        <ArrowUpRight className="h-3 w-3" /> Sent
      </Badge>
    );
  }
  if (type === "received") {
    return (
      <Badge variant="success" className="gap-1">
        <ArrowDownLeft className="h-3 w-3" /> Received
      </Badge>
    );
  }
  return (
    <Badge variant="blue" className="gap-1">
      <Code2 className="h-3 w-3" /> Contract
    </Badge>
  );
}
