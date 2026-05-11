"use client";

import { useState, useEffect, useCallback } from "react";

export interface WatchlistEntry {
  address: string;
  label?: string;
  addedAt: number;
}

const STORAGE_KEY = "megastats_watchlist";

export function useWatchlist() {
  const [wallets, setWallets] = useState<WatchlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWallets(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const save = useCallback((entries: WatchlistEntry[]) => {
    setWallets(entries);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {}
  }, []);

  const add = useCallback((address: string, label?: string) => {
    setWallets((prev) => {
      if (prev.some((w) => w.address === address)) return prev;
      const next = [...prev, { address, label, addedAt: Date.now() }];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const remove = useCallback((address: string) => {
    setWallets((prev) => {
      const next = prev.filter((w) => w.address !== address);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const rename = useCallback((address: string, label: string) => {
    setWallets((prev) => {
      const next = prev.map((w) => w.address === address ? { ...w, label } : w);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isTracked = useCallback(
    (address: string) => wallets.some((w) => w.address === address),
    [wallets]
  );

  return { wallets, hydrated, add, remove, rename, isTracked };
}
