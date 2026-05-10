import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, chars = 6): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

export function formatEth(wei: string, decimals = 6): string {
  if (!wei || wei === "0") return "0 ETH";
  const eth = Number(BigInt(wei)) / 1e18;
  if (eth < 0.000001) return "<0.000001 ETH";
  return `${eth.toLocaleString("en-US", { maximumFractionDigits: decimals })} ETH`;
}

export function formatEthCompact(wei: string): string {
  if (!wei || wei === "0") return "0 ETH";
  const eth = Number(BigInt(wei)) / 1e18;
  if (eth >= 1000) return `${(eth / 1000).toFixed(2)}K ETH`;
  if (eth >= 1) return `${eth.toFixed(4)} ETH`;
  if (eth >= 0.0001) return `${eth.toFixed(6)} ETH`;
  if (eth >= 0.000001) return `${eth.toFixed(8)} ETH`;
  return `${eth.toFixed(10)} ETH`;
}

export function weiToUsd(wei: string, ethPrice: number): string {
  if (!wei || wei === "0" || ethPrice === 0) return "$0.00";
  const eth = Number(BigInt(wei)) / 1e18;
  const usd = eth * ethPrice;
  if (usd < 0.01) return `<$0.01`;
  if (usd >= 1000) return `$${(usd / 1000).toFixed(2)}K`;
  return `$${usd.toFixed(2)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}
