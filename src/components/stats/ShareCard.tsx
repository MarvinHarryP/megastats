"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

interface Props {
  rank: number;
  totalPoints: number;
  weeklyPoints: number;
  totalInLeaderboard: number;
  totalPointsSum: number;
  megaPrice: number | null;
}

const SEASON1_POOL = 62_500_000;
const DISCOUNT = 0.8;

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtMega(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

export function ShareCard({ rank, totalPoints, weeklyPoints, totalInLeaderboard, totalPointsSum, megaPrice }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const share = totalPointsSum > 0 ? totalPoints / totalPointsSum : 0;
  const estimatedMega = share * SEASON1_POOL * DISCOUNT;
  const estimatedUsd = megaPrice ? estimatedMega * megaPrice : null;
  const percentile = totalInLeaderboard > 0 ? Math.ceil((rank / totalInLeaderboard) * 100) : null;

  async function download() {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "megastats-card.png";
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Small trigger button */}
      <button
        onClick={download}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <span>🃏</span>
        {loading ? "Generating…" : "Claim MegaStats Card"}
      </button>

      {/* Hidden card rendered off-screen for capture */}
      <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none", zIndex: -1 }}>
        <div
          ref={cardRef}
          style={{
            width: 480,
            background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
            borderRadius: 20,
            padding: "32px 36px",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)", borderRadius: "50%" }} />

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" }}>
                <span style={{ color: "#a78bfa" }}>Mega</span>Stats
              </span>
            </div>
            <div style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.5)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600, color: "#c4b5fd", letterSpacing: "0.05em" }}>
              SEASON 1
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Total Points</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: "#a78bfa", lineHeight: 1, margin: "0 0 4px" }}>{fmt(totalPoints)}</p>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>all time</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Weekly Rank</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1, margin: "0 0 4px" }}>#{rank.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                of {totalInLeaderboard.toLocaleString()}
                {percentile !== null && <span style={{ color: "#a78bfa", fontWeight: 600 }}> · top {percentile}%</span>}
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>This Week</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: "#34d399", lineHeight: 1, margin: "0 0 4px" }}>{weeklyPoints > 0 ? `+${fmt(weeklyPoints)}` : "—"}</p>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>points earned</p>
            </div>
            <div style={{ background: "rgba(139,92,246,0.12)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(139,92,246,0.25)" }}>
              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>🪂 Est. Airdrop</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1, margin: "0 0 4px" }}>~{fmtMega(estimatedMega)} <span style={{ fontSize: 16, color: "#a78bfa" }}>MEGA</span></p>
              {estimatedUsd !== null && <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>≈ ${estimatedUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 11, color: "#4b5563", margin: 0 }}>mega.cryptoxmap.xyz</p>
            <p style={{ fontSize: 10, color: "#374151", margin: 0 }}>est. airdrop is a rough estimate</p>
          </div>
        </div>
      </div>
    </>
  );
}
