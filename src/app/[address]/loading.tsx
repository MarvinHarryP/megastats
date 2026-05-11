export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Main loading card */}
      <div className="rounded-2xl border bg-card p-8 flex flex-col items-center gap-6 text-center">

        {/* Animated chain icon */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-primary/60 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-1">
          <p className="text-lg font-semibold text-primary">Loading wallet data…</p>
          <p className="text-xs text-muted-foreground">Scanning on-chain data via Blockscout</p>
        </div>

        {/* Pure CSS indeterminate progress bar — no JS needed */}
        <div className="w-full max-w-xs">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary animate-[loading_1.4s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Animated blocks */}
        <div className="flex gap-1.5 items-end h-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-2 rounded-sm bg-primary/40 animate-pulse"
              style={{
                height: `${20 + Math.sin(i * 0.8) * 12}px`,
                animationDelay: `${i * 80}ms`,
                animationDuration: `${800 + i * 60}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Skeleton placeholders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-4 space-y-3 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-6 w-24 rounded bg-muted" />
            <div className="h-2 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border h-40 animate-pulse bg-muted/30" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border h-48 animate-pulse bg-muted/30" />
        <div className="rounded-xl border h-48 animate-pulse bg-muted/30" />
      </div>
    </div>
  );
}
