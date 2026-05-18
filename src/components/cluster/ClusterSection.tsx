"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";

interface WalletStats {
  txCount: number | null;
  volumeUsd: string | null;
  activeDays: number | null;
  currentStreak: number | null;
  terminalPoints: number | null;
  weeklyPoints: number | null;
  xAccount: string | null;
}

interface MemberData extends WalletStats {
  id: string;
  clusterAddress: string;
  memberAddress: string;
  label: string | null;
}

interface Aggregated {
  totalTxs: number;
  totalVolume: number;
  totalTerminalPoints: number;
  totalWeeklyPoints: number;
}

interface ClusterData {
  address: string;
  members: MemberData[];
  mainWallet: WalletStats;
  aggregated: Aggregated;
}

interface Props {
  address: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}

function WalletRow({
  address,
  stats,
  label,
  isMain,
  onRemove,
  removeDisabled,
  onRenameLabel,
  balanceUsd,
}: {
  address: string;
  stats: WalletStats;
  label?: string | null;
  isMain?: boolean;
  onRemove?: () => void;
  removeDisabled?: boolean;
  onRenameLabel?: (newLabel: string) => Promise<void>;
  balanceUsd?: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(label ?? "");
  const [saving, setSaving] = useState(false);

  const vol = parseFloat(stats.volumeUsd ?? "0");
  const hasStats = stats.txCount !== null || vol > 0 || stats.activeDays !== null;

  async function saveLabel() {
    if (!onRenameLabel) return;
    setSaving(true);
    await onRenameLabel(editValue.trim());
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {isMain && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">main</span>
          )}
          {!isMain && !editing && (
            <>
              {label && (
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{label}</span>
              )}
              {onRenameLabel && (
                <button
                  onClick={() => { setEditValue(label ?? ""); setEditing(true); }}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit label"
                >
                  ✎
                </button>
              )}
            </>
          )}
          {!isMain && editing && (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveLabel(); if (e.key === "Escape") setEditing(false); }}
                placeholder="Label…"
                className="text-xs rounded border border-border bg-background px-1.5 py-0.5 w-24 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button onClick={saveLabel} disabled={saving} className="text-xs text-primary hover:opacity-80 disabled:opacity-40">
                {saving ? "…" : "✓"}
              </button>
              <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}
          {stats.xAccount && (
            <span className="text-xs text-muted-foreground">@{stats.xAccount}</span>
          )}
          <Link href={`/${address}`} className="font-mono text-xs text-primary hover:underline">
            {formatAddress(address, 10)}
          </Link>
        </div>

        {/* Stats */}
        {hasStats ? (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
            {stats.txCount !== null && (
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{fmt(stats.txCount)}</span> txs
              </span>
            )}
            {vol > 0 && (
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{fmtUsd(vol)}</span> vol
              </span>
            )}
            {stats.activeDays !== null && stats.activeDays > 0 && (
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{stats.activeDays}</span> active days
              </span>
            )}
            {stats.currentStreak !== null && stats.currentStreak > 0 && (
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{stats.currentStreak}d</span> streak
              </span>
            )}
            {balanceUsd != null && balanceUsd > 0 && (
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-indigo-500">{fmtUsd(balanceUsd)}</span> balance
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic mt-1">Stats loading…</p>
        )}
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          disabled={removeDisabled}
          className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40 shrink-0 mt-0.5 text-xs px-1"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const SESSION_KEY = (addr: string) => `cluster_session_${addr.toLowerCase()}`;

function loadSession(addr: string): string | null {
  try {
    return localStorage.getItem(SESSION_KEY(addr));
  } catch {
    return null;
  }
}

function saveSession(addr: string, token: string) {
  try {
    localStorage.setItem(SESSION_KEY(addr), token);
  } catch {}
}

function clearSession(addr: string) {
  try {
    localStorage.removeItem(SESSION_KEY(addr));
  } catch {}
}

export function ClusterSection({ address }: Props) {
  const { address: connectedAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [cluster, setCluster] = useState<ClusterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newMember, setNewMember] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Map<string, number>>(new Map());
  const [totalBalance, setTotalBalance] = useState<number>(0);

  const isOwner = connectedAddress?.toLowerCase() === address.toLowerCase();

  const fetchCluster = useCallback(async () => {
    try {
      const res = await fetch(`/api/cluster/${address}`);
      const data = await res.json();
      setCluster(data.cluster);
    } catch {
      setError("Failed to load cluster");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { fetchCluster(); }, [fetchCluster]);

  // Fetch balances for all cluster wallets in parallel
  useEffect(() => {
    if (!cluster) return;
    const addresses = [cluster.address, ...cluster.members.map((m) => m.memberAddress)];
    Promise.all(
      addresses.map((addr) =>
        fetch(`/api/wallet/${addr}/balance`)
          .then((r) => r.json())
          .then((d) => ({ addr, usd: d.totalUsd ?? 0 }))
          .catch(() => ({ addr, usd: 0 }))
      )
    ).then((results) => {
      const map = new Map(results.map((r) => [r.addr, r.usd]));
      setBalances(map);
      setTotalBalance(results.reduce((s, r) => s + r.usd, 0));
    });
  }, [cluster]);

  /** Returns auth payload — uses cached session token, or prompts for signature */
  async function getAuth(): Promise<Record<string, unknown>> {
    const cached = loadSession(address);
    if (cached) return { sessionToken: cached };

    // Need fresh signature
    const timestamp = Date.now();
    const message = `MegaStats cluster: ${address.toLowerCase()} — ${timestamp}`;
    const signature = await signMessageAsync({ message });
    return { signature, timestamp };
  }

  /** Save session token returned by API (if any) */
  function handleSessionToken(data: { sessionToken?: string }) {
    if (data.sessionToken) saveSession(address, data.sessionToken);
  }

  async function handleCreateCluster() {
    setActionLoading(true);
    setError(null);
    try {
      // Creating always needs a fresh signature
      const timestamp = Date.now();
      const message = `MegaStats cluster: ${address.toLowerCase()} — ${timestamp}`;
      const signature = await signMessageAsync({ message });

      const res = await fetch(`/api/cluster/${address}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, timestamp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      handleSessionToken(data);
      await fetchCluster();
      setOpen(true);
    } catch (e: unknown) {
      setError(e instanceof Error && e.message.includes("rejected") ? "Signature rejected" : (e instanceof Error ? e.message : "Failed"));
    } finally {
      setActionLoading(false);
    }
  }

  /** Makes an authenticated API call, auto-retries with fresh signature if session expired.
   *  Returns parsed JSON data and ok status directly to avoid body-consumption issues. */
  async function authFetch(
    url: string,
    method: string,
    extraBody: Record<string, unknown> = {}
  ): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    const doRequest = async (auth: Record<string, unknown>) => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...extraBody, ...auth }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: `Server error (HTTP ${res.status})` };
        console.error("Non-JSON response:", res.status, text.slice(0, 300));
      }
      return { ok: res.ok, data };
    };

    const auth = await getAuth();
    const result = await doRequest(auth);

    // Auto-retry with fresh signature if session expired
    if (!result.ok) {
      const errMsg = (result.data.error as string) ?? "";
      if (errMsg.includes("expired") || errMsg.includes("Invalid session")) {
        clearSession(address);
        const freshAuth = await getAuth();
        return doRequest(freshAuth);
      }
    }

    return result;
  }

  async function handleAddMember() {
    if (!newMember.trim()) return;
    setActionLoading(true);
    setAddError(null);
    try {
      const { ok, data } = await authFetch(`/api/cluster/${address}/members`, "POST", {
        memberAddress: newMember.trim(),
        label: newLabel.trim() || undefined,
      });
      if (!ok) throw new Error((data.error as string) ?? "Failed");
      handleSessionToken(data as { sessionToken?: string });
      setNewMember("");
      setNewLabel("");
      await fetchCluster();
      setTimeout(fetchCluster, 8000);
    } catch (e: unknown) {
      setAddError(e instanceof Error && e.message.includes("rejected") ? "Signature rejected" : (e instanceof Error ? e.message : "Failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRenameLabel(memberAddress: string, newLabel: string) {
    const { ok, data } = await authFetch(`/api/cluster/${address}/members`, "POST", {
      memberAddress,
      label: newLabel || undefined,
    });
    if (!ok) throw new Error((data.error as string) ?? "Failed");
    handleSessionToken(data as { sessionToken?: string });
    await fetchCluster();
  }

  async function handleRemoveMember(memberAddress: string) {
    setActionLoading(true);
    try {
      const { ok, data } = await authFetch(`/api/cluster/${address}/members/${memberAddress}`, "DELETE");
      if (!ok) throw new Error((data.error as string) ?? "Failed");
      handleSessionToken(data as { sessionToken?: string });
      await fetchCluster();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return null;

  // No cluster — only owner sees create prompt
  if (!cluster) {
    if (!isOwner) return null;
    return (
      <div className="rounded-xl border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span>🔗</span>
          <div>
            <p className="text-sm font-medium">Wallet Cluster</p>
            <p className="text-xs text-muted-foreground">Group your wallets and see combined stats</p>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleCreateCluster}
          disabled={actionLoading}
          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/40 transition-colors disabled:opacity-50 shrink-0"
        >
          {actionLoading ? "Signing…" : "Create Cluster →"}
        </button>
      </div>
    );
  }

  const agg = cluster.aggregated;
  const memberCount = cluster.members.length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">

      {/* ── Aggregated stats header (always visible) ── */}
      <div className="flex flex-wrap sm:flex-nowrap items-stretch divide-y sm:divide-y-0 sm:divide-x divide-border">

        {/* Label */}
        <div className="flex items-center gap-2 px-4 py-3 shrink-0">
          <span className="text-lg">🔗</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Cluster</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {memberCount + 1} wallet{memberCount + 1 !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Total Txs */}
        <div className="px-4 py-3 flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total Txs</p>
          <p className="text-2xl font-bold leading-tight mt-0.5">{fmt(agg.totalTxs)}</p>
        </div>

        {/* Total Volume */}
        <div className="px-4 py-3 flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total Volume</p>
          <p className="text-2xl font-bold leading-tight mt-0.5">{fmtUsd(agg.totalVolume)}</p>
        </div>

        {/* Total Balance */}
        <div className="px-4 py-3 flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total Balance</p>
          <p className="text-2xl font-bold text-indigo-500 leading-tight mt-0.5">
            {totalBalance > 0 ? fmtUsd(totalBalance) : <span className="text-muted-foreground/40">—</span>}
          </p>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center px-4 py-3 shrink-0 hover:bg-muted/20 transition-colors text-muted-foreground"
          title={open ? "Collapse" : "Expand"}
        >
          <span className="text-xs">{open ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* ── Expanded: individual wallets ── */}
      {open && (
        <div className="border-t border-border/60">
          {/* Main wallet */}
          <WalletRow
            address={cluster.address}
            stats={cluster.mainWallet}
            isMain
            balanceUsd={balances.get(cluster.address)}
          />

          {/* Secondary wallets */}
          {cluster.members.map((m) => (
            <WalletRow
              key={m.id}
              address={m.memberAddress}
              stats={m}
              label={m.label}
              onRemove={isOwner ? () => handleRemoveMember(m.memberAddress) : undefined}
              removeDisabled={actionLoading}
              onRenameLabel={isOwner ? (newLabel) => handleRenameLabel(m.memberAddress, newLabel) : undefined}
              balanceUsd={balances.get(m.memberAddress)}
            />
          ))}

          {memberCount === 0 && !isOwner && (
            <p className="px-4 py-3 text-sm text-muted-foreground">No secondary wallets yet.</p>
          )}

          {/* Add wallet (owner only) */}
          {isOwner && (
            <div className="bg-muted/20 px-4 py-3 space-y-2 border-t border-border/40">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Add Secondary Wallet</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="0x… wallet address"
                  className="flex-1 min-w-[180px] rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={handleAddMember}
                  disabled={actionLoading || !newMember.trim()}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted/40 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "…" : "Add"}
                </button>
              </div>
              {addError && <p className="text-xs text-red-500">{addError}</p>}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <p className="text-[11px] text-muted-foreground">Free · sign to verify ownership · no transaction</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
