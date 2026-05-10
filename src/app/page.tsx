import { WalletAutoRedirect } from "@/components/wallet/WalletAutoRedirect";
import { Search, Zap, TrendingUp, Flame } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10">
      <WalletAutoRedirect />

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground bg-muted/50">
          <Zap className="h-3.5 w-3.5 text-yellow-500" />
          Built on MegaETH
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Your <span className="text-primary">MegaETH</span> Stats
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Enter any wallet address to see fees paid, volume traded, transaction history, and airdrop streaks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {[
          { icon: Zap, label: "Fees Paid", desc: "See exactly how much you've spent on gas", color: "text-yellow-500" },
          { icon: TrendingUp, label: "Volume", desc: "Track every ETH you've sent & received", color: "text-blue-500" },
          { icon: Flame, label: "Streaks", desc: "Check your active days for airdrop farming", color: "text-orange-500" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="rounded-xl border p-4 bg-card space-y-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        Use the search bar above to look up any wallet
      </div>
    </div>
  );
}
