// Known DeFi protocol tokens on MegaETH
// Maps lowercase contract address → protocol metadata

export interface ProtocolInfo {
  protocol: string;
  type: string;      // "LP Position", "Staked", "Yield", "Rewards", etc.
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

  // Kumbaya LP positions (cowKumbaya*)
  "0xc845eac583558ef89315917bba7459e648030f0a": { protocol: "Kumbaya", type: "WETH/USDm LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0xdee9cacf23611d667b6f0143ca5eae6a88693d6c": { protocol: "Kumbaya", type: "MEGA/USDm LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0xa629db8732334a30a13325dad1b6eb9118122ad3": { protocol: "Kumbaya", type: "MEGA/USDm LP (0.3%)", icon: "🔄", url: "https://kumbaya.exchange" },
  "0x53223778137650b7e2162a796a4b6d07d9be2c01": { protocol: "Kumbaya", type: "MEGA/USDT0 LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0xd14c23ed38195c8c754e793849953df984dab529": { protocol: "Kumbaya", type: "WETH/USDT0 LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0xcbadc e0825ac9c9802e4d62c3a0cc29fbd7ec485": { protocol: "Kumbaya", type: "BTC.b/USDm LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0xdcdb09546179e38e41e39e8a14fdcc1dec885722": { protocol: "Kumbaya", type: "DUCK/WETH LP", icon: "🔄", url: "https://kumbaya.exchange" },

  // Kumbaya reward tokens (rcowKumbaya*)
  "0x84845b1eb38f334c664acaf332d857f790ebd700": { protocol: "Kumbaya", type: "WETH/USDm Rewards", icon: "🔄", url: "https://kumbaya.exchange" },
  "0x8197af78a8f1dee9b649ff0d191fb0b51d2d775b": { protocol: "Kumbaya", type: "MEGA/USDm Rewards", icon: "🔄", url: "https://kumbaya.exchange" },
  "0x8d0ab1d0d8c62ef7b45c0a04d1b6f25b438e0a1b": { protocol: "Kumbaya", type: "MEGA/USDm Rewards (0.3%)", icon: "🔄", url: "https://kumbaya.exchange" },
  "0x20b049ac987be82a9c52b5c5387358380ee9936d": { protocol: "Kumbaya", type: "MEGA/USDT0 Rewards", icon: "🔄", url: "https://kumbaya.exchange" },
  "0xf739c6bd9127543906d8eadc31cab31bfe9b6a15": { protocol: "Kumbaya", type: "WETH/USDT0 Rewards", icon: "🔄", url: "https://kumbaya.exchange" },

  // Kumbaya ICHI Vault positions
  "0x7b6875fdd25ba45c318ef1eda2ee823c860770e0": { protocol: "Kumbaya", type: "USDm/USDT0 Managed LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0xd5fff1bcaf8d8e415287a13f19208ba125062ba0": { protocol: "Kumbaya", type: "WETH/USDm Managed LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0x57c0bfab58616709420d8d9c67255455f16cf53f": { protocol: "Kumbaya", type: "USDm/BTC.b Managed LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0x923e0a5f97ef1227a9a707f85d6e2f0975412dbd": { protocol: "Kumbaya", type: "USDm/WETH Managed LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0x9c196c2bbec39e8be746847099baa1493461ec26": { protocol: "Kumbaya", type: "BTC.b/USDm Managed LP", icon: "🔄", url: "https://kumbaya.exchange" },
  "0xbbee7f8bf97e12ee28eb809fc3ee0956977b9e42": { protocol: "Kumbaya", type: "USDT0/USDm Managed LP", icon: "🔄", url: "https://kumbaya.exchange" },

  // Prism LP positions (cowPrism*)
  "0xd76d0173b79e09002328f791774867935e1e61fe": { protocol: "Prism", type: "WETH/USDm LP", icon: "🌀", url: "https://prism.fi" },
  "0x795fe6681b3b7d11a9fcf4cb92ad1fbe65b45182": { protocol: "Prism", type: "WETH/BTC.b LP", icon: "🌀", url: "https://prism.fi" },
  "0x3808e89223f26ddbacbf3cf36f99e37e537fb3de": { protocol: "Prism", type: "MEGA/USDM LP", icon: "🌀", url: "https://prism.fi" },
  "0x0e3f3b07582ba91abcf2bdea87639f0356929cbc": { protocol: "Prism", type: "BTC.b/USDT0 LP", icon: "🌀", url: "https://prism.fi" },

  // Prism reward tokens (rcowPrism*)
  "0xf995a90e338f2ae6456f79777f3bbac42c411f7b": { protocol: "Prism", type: "WETH/USDm Rewards", icon: "🌀", url: "https://prism.fi" },
  "0x3306e96bb2cb449bb7b1f794fcc890294c44dc36": { protocol: "Prism", type: "WETH/BTC.b Rewards", icon: "🌀", url: "https://prism.fi" },
  "0x00f88397182d20cf90f1232e67d6895e48f334b9": { protocol: "Prism", type: "MEGA/USDM Rewards", icon: "🌀", url: "https://prism.fi" },
  "0x17b67bb8c904f28619900b3473c9bf0616bcf781": { protocol: "Prism", type: "BTC.b/USDT0 Rewards", icon: "🌀", url: "https://prism.fi" },
};

// Pattern-based fallback detection from token name (for unknown contracts)
function extractPair(name: string): string {
  // "Cow Kumbaya MegaETH WETH-USDm" → "WETH/USDm"
  // "Reward Cow Kumbaya MegaETH WETH-USDm" → "WETH/USDm"
  const match = name.match(/MegaETH?\s+([A-Za-z0-9.]+)-([A-Za-z0-9.]+)/i);
  if (match) return `${match[1]}/${match[2]}`;
  return "LP";
}

export function detectByName(name: string): ProtocolInfo | null {
  const n = name.toLowerCase();

  // Cow AMM positions
  if (n.includes("cow kumbaya") || n.includes("reward cow kumbaya")) {
    const isReward = n.includes("reward");
    const pair = extractPair(name);
    return { protocol: "Kumbaya", type: `${pair} ${isReward ? "Rewards" : "LP"}`, icon: "🔄", url: "https://kumbaya.exchange" };
  }
  if (n.includes("cow prism") || n.includes("reward cow prism")) {
    const isReward = n.includes("reward");
    const pair = extractPair(name);
    return { protocol: "Prism", type: `${pair} ${isReward ? "Rewards" : "LP"}`, icon: "🌀", url: "https://prism.fi" };
  }
  if (n.includes("ichi vault") || n.includes("iv-kumbaya")) {
    return { protocol: "Kumbaya", type: "Managed LP", icon: "🔄", url: "https://kumbaya.exchange" };
  }

  return null;
}

export function detectBySymbol(symbol: string, name: string): ProtocolInfo | null {
  const s = symbol.toUpperCase();
  const n = name.toLowerCase();

  // Try name-based detection first (more accurate)
  const byName = detectByName(name);
  if (byName) return byName;

  if (s.startsWith("GLV") || n.includes("gmx liquidity")) {
    return { protocol: "GMX", type: "Liquidity Vault", icon: "🔵" };
  }
  if (s.startsWith("GM") && (n.includes("gmx market") || n.includes("gmx"))) {
    return { protocol: "GMX", type: "GM Market", icon: "🔵" };
  }
  if (n.includes("gains network") || n.includes("gtrade")) {
    return { protocol: "Gains Network", type: "Staked", icon: "📈" };
  }
  if (s.endsWith("Y") && n.includes("yield")) {
    return { protocol: "Yield", type: "Yield Position", icon: "🌾" };
  }
  if (s.startsWith("A") && n.includes("aave")) {
    return { protocol: "Aave", type: "Supplied", icon: "👻" };
  }

  return null;
}

export function lookupProtocol(address: string, symbol: string, name: string): ProtocolInfo | null {
  const byAddress = REGISTRY[address.toLowerCase()];
  if (byAddress) return byAddress;
  return detectBySymbol(symbol, name);
}
