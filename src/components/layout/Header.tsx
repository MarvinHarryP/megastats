"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidAddress } from "@/lib/utils";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";

export function Header() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = value.trim().toLowerCase();
    if (!isValidAddress(addr)) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/${addr}`);
    setValue("");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-14 flex items-center gap-4">
        <a href="/" className="font-bold text-lg shrink-0">
          <span className="text-primary">Mega</span>Stats
        </a>

        <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(false); }}
              placeholder="0x... wallet address"
              className={`pl-8 font-mono text-sm ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>

        {/* Desktop nav links */}
        <a
          href="/swap"
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors shrink-0"
        >
          🔄 Swap
        </a>

        <a
          href="/leaderboard"
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors shrink-0"
        >
          🏆 Leaderboard
        </a>

        <a
          href="/whales"
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors shrink-0"
        >
          🐋 Whales
        </a>

        <a
          href="/tracker"
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors shrink-0"
        >
          👀 Tracker
        </a>

        {/* Mobile hamburger button */}
        <button
          className="sm:hidden p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="shrink-0">
          <WalletConnectButton />
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-background px-4 py-3 flex flex-col gap-1">
          <a
            href="/swap"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-blue-700 dark:text-blue-400"
          >
            🔄 Swap
          </a>
          <a
            href="/leaderboard"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-yellow-700 dark:text-yellow-400"
          >
            🏆 Leaderboard
          </a>
          <a
            href="/whales"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-green-700 dark:text-green-400"
          >
            🐋 Whales
          </a>
          <a
            href="/tracker"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-purple-700 dark:text-purple-400"
          >
            👀 Tracker
          </a>
        </div>
      )}
    </header>
  );
}
