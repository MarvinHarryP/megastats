// Known DeFi protocol tokens on MegaETH
// Maps lowercase contract address → protocol metadata

export interface ProtocolInfo {
  protocol: string;
  type: string;      // "Liquidity Pool", "Staked", "Yield", "Market", etc.
  icon: string;      // emoji
  url?: string;      // protocol website
}

const REGISTRY: Record<string, ProtocolInfo> = {
  // GMX — Liquidity Vaults
  "0x3782d91c5888de31f627495e6aaac3f09499fe72": {
    protocol: "GMX",
    type: "Liquidity Vault",
    icon: "🔵",
    url: "https://app.gmx.io",
  },
  // GMX — GM Market tokens
  "0x9b1b72720f6d277f3b1e607a0c5fab1b300248b1": { protocol: "GMX", type: "GM Market", icon: "🔵", url: "https://app.gmx.io" },
  "0x1b997cb4841c4cb360e384192ffd7fb26eb10e5f": { protocol: "GMX", type: "GM Market", icon: "🔵", url: "https://app.gmx.io" },
  "0xc5c9b5e23810565763de41144741477eecb25e2e": { protocol: "GMX", type: "GM Market", icon: "🔵", url: "https://app.gmx.io" },
  "0x31edcc52be2fa55ba68f50409f9e6b7d9ebf3d59": { protocol: "GMX", type: "GM Market", icon: "🔵", url: "https://app.gmx.io" },
  "0xe8e716f1cddffe0698b86919d41a8228d701fee9": { protocol: "GMX", type: "GM Market", icon: "🔵", url: "https://app.gmx.io" },
  "0xbc7edfa7491cbff317a65788e0e0cd89e91ec8a7": { protocol: "GMX", type: "GM Market", icon: "🔵", url: "https://app.gmx.io" },

  // Gains Network (gTrade)
  "0x46344456f130e9dcdea7f98cdb0e02fb9f4ab72d": {
    protocol: "Gains Network",
    type: "Staked USDM",
    icon: "📈",
    url: "https://gains.trade",
  },
  "0x551dfe38994ec53c9e7e18084d73893225eea3bf": {
    protocol: "Gains Network",
    type: "GNS Token",
    icon: "📈",
    url: "https://gains.trade",
  },

  // USDm Yield
  "0x2ea493384f42d7ea78564f3ef4c86986eab4a890": {
    protocol: "USDm",
    type: "Yield Position",
    icon: "🌾",
    url: "https://usdm.fi",
  },
};

// Pattern-based fallback detection (for unknown contracts)
export function detectBySymbol(symbol: string, name: string): ProtocolInfo | null {
  const s = symbol.toUpperCase();
  const n = name.toLowerCase();

  if (s.startsWith("GLV") || n.includes("gmx liquidity")) {
    return { protocol: "GMX", type: "Liquidity Vault", icon: "🔵" };
  }
  if (s.startsWith("GM[") || s.startsWith("GM ") || n.includes("gmx market")) {
    return { protocol: "GMX", type: "GM Market", icon: "🔵" };
  }
  if (s.startsWith("G") && (n.includes("gains") || n.includes("gtrade"))) {
    return { protocol: "Gains Network", type: "Staked", icon: "📈" };
  }
  if (s.endsWith("Y") && n.includes("yield")) {
    return { protocol: "Yield", type: "Yield Position", icon: "🌾" };
  }
  if (s.includes("-LP") || s.includes("LP-") || n.includes("liquidity pool") || n.includes("uniswap v")) {
    return { protocol: "Liquidity Pool", type: "LP Position", icon: "💧" };
  }
  if (s.startsWith("A") && n.includes("aave")) {
    return { protocol: "Aave", type: "Supplied", icon: "👻" };
  }
  if (s.startsWith("C") && n.includes("compound")) {
    return { protocol: "Compound", type: "Supplied", icon: "🟢" };
  }

  return null;
}

export function lookupProtocol(address: string, symbol: string, name: string): ProtocolInfo | null {
  const byAddress = REGISTRY[address.toLowerCase()];
  if (byAddress) return byAddress;
  return detectBySymbol(symbol, name);
}
