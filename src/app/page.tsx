import { Zap, TrendingUp, Flame } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 overflow-hidden">
      {/* Badge */}
      <div className="animate-fade-in-up opacity-0 [animation-delay:0ms] [animation-fill-mode:forwards]">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground bg-muted/50">
          <Zap className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
          Built on MegaETH
        </div>
      </div>

      {/* Heading */}
      <div className="text-center space-y-4 animate-fade-in-up opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Your <span className="text-primary">MegaETH</span> Stats
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Enter any wallet address to see fees paid, volume traded, transaction history, and airdrop streaks.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {[
          { icon: Zap, label: "Fees Paid", desc: "See exactly how much you've spent on gas", color: "text-yellow-500", delay: "200ms" },
          { icon: TrendingUp, label: "Volume", desc: "Track every ETH you've sent & received", color: "text-blue-500", delay: "300ms" },
          { icon: Flame, label: "Streaks", desc: "Check your active days for airdrop farming", color: "text-orange-500", delay: "400ms" },
        ].map(({ icon: Icon, label, desc, color, delay }) => (
          <div
            key={label}
            className="rounded-xl border p-4 bg-card space-y-2 animate-fade-in-up opacity-0 [animation-fill-mode:forwards] hover:border-primary/50 hover:shadow-md transition-all duration-200"
            style={{ animationDelay: delay }}
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom hint */}
      <div className="animate-fade-in-up opacity-0 [animation-delay:500ms] [animation-fill-mode:forwards] text-sm text-muted-foreground">
        ↑ Use the search bar above to look up any wallet
      </div>
    </div>
  );
}
