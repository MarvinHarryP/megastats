import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swap — MegaStats",
};

export default function SwapPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Swap</h1>
          <p className="text-sm text-muted-foreground">Powered by Kumbaya</p>
        </div>
        <a
          href="https://kumbaya.exchange"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Open in new tab ↗
        </a>
      </div>

      <div className="rounded-xl border overflow-hidden bg-card" style={{ height: "calc(100vh - 180px)", minHeight: "600px" }}>
        <iframe
          src="https://kumbaya.exchange"
          className="w-full h-full"
          title="Kumbaya Swap"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}
