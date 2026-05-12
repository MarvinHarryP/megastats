"use client";

import { useState } from "react";
import { Plus, Check, Loader2, X } from "lucide-react";

type State = "idle" | "loading" | "done" | "error";

export function TrackButton({ address, alreadyTracked }: { address: string; alreadyTracked: boolean }) {
  const [state, setState] = useState<State>(alreadyTracked ? "done" : "idle");

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(`/api/wallet/${address}/track`, { method: "POST" });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-500 font-medium px-2 py-1">
        <Check className="h-3 w-3" /> Tracked
      </span>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={() => setState("idle")}
        className="flex items-center gap-1 text-xs text-red-400 font-medium px-2 py-1"
      >
        <X className="h-3 w-3" /> Retry
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
    >
      {state === "loading"
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : <Plus className="h-3 w-3" />}
      {state === "loading" ? "Tracking…" : "Track"}
    </button>
  );
}
