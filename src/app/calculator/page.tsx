"use client";

import { useState } from "react";

const USDM_RATES = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50];

export default function CalculatorPage() {
  const [points, setPoints] = useState("");
  const [lookup, setLookup] = useState("");
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [selectedRate, setSelectedRate] = useState(0.20);

  const numPoints = parseFloat(points.replace(/,/g, "")) || 0;
  const estimatedUsdm = numPoints * selectedRate;

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const val = lookup.trim().replace(/^@/, "");
    if (!val) return;
    setLoadingLookup(true);
    setLookupError("");

    // Try wallet address first
    const isAddress = /^0x[a-fA-F0-9]{40}$/i.test(val);
    try {
      if (isAddress) {
        const res = await fetch(`/api/terminal/lookup?address=${encodeURIComponent(val.toLowerCase())}`);
        if (res.ok) {
          const d = await res.json();
          setPoints(d.totalPoints.toString());
          setLoadingLookup(false);
          return;
        }
        // Wallet address not found — Terminal doesn't expose wallet addresses publicly
        setLookupError("Wallet not linked to Terminal leaderboard. Try your X handle (e.g. @username) instead, or enter points manually.");
      } else {
        // X handle lookup
        const res = await fetch(`/api/terminal/lookup?handle=${encodeURIComponent(val)}`);
        if (!res.ok) {
          setLookupError("Handle not found in leaderboard.");
        } else {
          const d = await res.json();
          setPoints(d.totalPoints.toString());
        }
      }
    } catch {
      setLookupError("Error loading data.");
    }
    setLoadingLookup(false);
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pt-4">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl">💰</div>
        <h1 className="text-3xl font-bold tracking-tight">USDM Rewards Calculator</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Terminal ended early (Week 3). Rewards will be paid in USDM.
          Enter your points to estimate your reward.
        </p>
      </div>

      {/* Lookup */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <p className="text-sm font-medium">Load points from wallet or X handle</p>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            value={lookup}
            onChange={(e) => { setLookup(e.target.value); setLookupError(""); }}
            placeholder="0x... wallet address or @xhandle"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
          />
          <button
            type="submit"
            disabled={loadingLookup}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
          >
            {loadingLookup ? "…" : "Load"}
          </button>
        </form>
        {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
      </div>

      {/* Points input */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Terminal Points</label>
          <input
            type="number"
            min="0"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Enter your points..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-lg font-bold placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Rate selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rate per Point (community estimate)</label>
          <div className="flex flex-wrap gap-2">
            {USDM_RATES.map((rate) => (
              <button
                key={rate}
                onClick={() => setSelectedRate(rate)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  selectedRate === rate
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground border-border hover:text-foreground hover:border-foreground"
                }`}
              >
                ${rate.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className={`rounded-xl p-5 text-center space-y-1 transition-colors ${numPoints > 0 ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-muted/40 border border-border"}`}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estimated Reward</p>
          <p className="text-4xl font-bold">
            {numPoints > 0
              ? `$${estimatedUsdm.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {numPoints > 0
              ? `${numPoints.toLocaleString()} pts × $${selectedRate.toFixed(2)} = ${estimatedUsdm.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDM`
              : "Enter your points above"
            }
          </p>
        </div>

        {/* All rates overview */}
        {numPoints > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">All scenarios</p>
            <div className="grid grid-cols-4 gap-2">
              {USDM_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSelectedRate(rate)}
                  className={`rounded-lg p-2 text-center border transition-colors cursor-pointer ${
                    selectedRate === rate
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">${rate.toFixed(2)}</p>
                  <p className="text-sm font-bold">
                    ${(numPoints * rate).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center pb-4">
        Community estimates only · Actual USDM rewards may differ · Terminal Week 3 ended May 21, 2026
      </p>
    </div>
  );
}
