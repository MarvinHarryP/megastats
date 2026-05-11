import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { isValidAddress } from "@/lib/utils";
import { getPositionAmounts, sqrtPriceX96ToPrice } from "@/lib/v3-math";

// MegaETH mainnet — thirdweb public RPC (drpc.org is rate-limited on free tier)
const MEGAETH_RPC = "https://4326.rpc.thirdweb.com";

const megaeth = {
  id: 4326,
  name: "MegaETH",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [MEGAETH_RPC] } },
} as const;

// Known V3 Dexes on MegaETH
const V3_DEXES = [
  {
    name: "Kumbaya",
    color: "orange",
    icon: "🔄",
    url: "https://kumbaya.exchange",
    positionManager: "0x2b781C57e6358f64864Ff8EC464a03Fdaf9974bA" as `0x${string}`,
    factory: "0x68b34591f662508076927803c567Cc8006988a09" as `0x${string}`,
  },
  // Prism uses same Uniswap V3 architecture — add manager address when found
];

const POSITION_MANAGER_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
]);

const FACTORY_ABI = parseAbi([
  "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)",
]);

const POOL_ABI = parseAbi([
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
]);

const ERC20_ABI = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

const BLOCKSCOUT = "https://megaeth.blockscout.com/api/v2";

export interface V3Position {
  protocol: string;
  icon: string;
  color: string;
  url: string;
  tokenId: string;
  token0Symbol: string;
  token1Symbol: string;
  fee: number; // basis points e.g. 3000 = 0.3%
  inRange: boolean;
  amount0: number;
  amount1: number;
  usdValue: number | null;
  token0UsdPrice: number | null;
  token1UsdPrice: number | null;
}

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase() as `0x${string}`;

  if (!isValidAddress(address)) {
    return NextResponse.json({ positions: [] }, { status: 400 });
  }

  const client = createPublicClient({
    chain: megaeth,
    transport: http(MEGAETH_RPC, { timeout: 10_000 }),
  });

  const allPositions: V3Position[] = [];

  for (const dex of V3_DEXES) {
    try {
      const positions = await fetchDexPositions(client, dex, address);
      allPositions.push(...positions);
    } catch {
      // Skip failed dex reads
    }
  }

  return NextResponse.json({ positions: allPositions });
}

async function fetchDexPositions(
  client: ReturnType<typeof createPublicClient>,
  dex: (typeof V3_DEXES)[number],
  address: `0x${string}`
): Promise<V3Position[]> {
  // Get number of LP NFTs owned
  const balance = await client.readContract({
    address: dex.positionManager,
    abi: POSITION_MANAGER_ABI,
    functionName: "balanceOf",
    args: [address],
  });

  if (balance === 0n) return [];

  // Get all token IDs
  const tokenIdCalls = Array.from({ length: Number(balance) }, (_, i) => ({
    address: dex.positionManager,
    abi: POSITION_MANAGER_ABI,
    functionName: "tokenOfOwnerByIndex" as const,
    args: [address, BigInt(i)] as const,
  }));

  const tokenIdResults = await client.multicall({ contracts: tokenIdCalls });
  const tokenIds = tokenIdResults
    .map((r) => (r.status === "success" ? (r.result as bigint) : null))
    .filter((id): id is bigint => id !== null);

  // Get position details for all token IDs
  const positionCalls = tokenIds.map((tokenId) => ({
    address: dex.positionManager,
    abi: POSITION_MANAGER_ABI,
    functionName: "positions" as const,
    args: [tokenId] as const,
  }));

  const positionResults = await client.multicall({ contracts: positionCalls });

  const results: V3Position[] = [];

  // Process each position
  for (let i = 0; i < tokenIds.length; i++) {
    const result = positionResults[i];
    if (result.status !== "success") continue;

    const raw = result.result as unknown as readonly [bigint, `0x${string}`, `0x${string}`, `0x${string}`, number, number, number, bigint, bigint, bigint, bigint, bigint];
    const pos = {
      token0: raw[2],
      token1: raw[3],
      fee: raw[4],
      tickLower: raw[5],
      tickUpper: raw[6],
      liquidity: raw[7],
      tokensOwed0: raw[10],
      tokensOwed1: raw[11],
    };

    // Skip closed positions
    if (pos.liquidity === 0n && pos.tokensOwed0 === 0n && pos.tokensOwed1 === 0n) continue;

    try {
      // Fetch token metadata + pool data in parallel
      const [
        token0Symbol, token0Decimals,
        token1Symbol, token1Decimals,
        poolAddress,
      ] = await Promise.all([
        client.readContract({ address: pos.token0, abi: ERC20_ABI, functionName: "symbol" }).catch(() => "?"),
        client.readContract({ address: pos.token0, abi: ERC20_ABI, functionName: "decimals" }).catch(() => 18),
        client.readContract({ address: pos.token1, abi: ERC20_ABI, functionName: "symbol" }).catch(() => "?"),
        client.readContract({ address: pos.token1, abi: ERC20_ABI, functionName: "decimals" }).catch(() => 18),
        client.readContract({
          address: dex.factory,
          abi: FACTORY_ABI,
          functionName: "getPool",
          args: [pos.token0, pos.token1, pos.fee],
        }).catch(() => null),
      ]);

      if (!poolAddress || poolAddress === "0x0000000000000000000000000000000000000000") continue;

      // Get pool's current price
      const slot0 = await client.readContract({
        address: poolAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: "slot0",
      });

      const sqrtPriceX96 = slot0[0] as bigint;
      const tickCurrent = slot0[1] as number;

      // Calculate token amounts
      const { amount0: rawAmount0, amount1: rawAmount1, inRange } = getPositionAmounts(
        sqrtPriceX96,
        tickCurrent,
        pos.tickLower,
        pos.tickUpper,
        pos.liquidity,
        pos.tokensOwed0,
        pos.tokensOwed1
      );

      const dec0 = Number(token0Decimals);
      const dec1 = Number(token1Decimals);
      const amount0 = Number(rawAmount0) / 10 ** dec0;
      const amount1 = Number(rawAmount1) / 10 ** dec1;

      // Get token USD prices from Blockscout
      const [price0, price1] = await Promise.all([
        fetchTokenPrice(pos.token0),
        fetchTokenPrice(pos.token1),
      ]);

      const usdValue =
        price0 !== null || price1 !== null
          ? (amount0 * (price0 ?? 0)) + (amount1 * (price1 ?? 0))
          : null;

      const feePercent = pos.fee / 10000; // e.g. 3000 → 0.3

      results.push({
        protocol: dex.name,
        icon: dex.icon,
        color: dex.color,
        url: dex.url,
        tokenId: tokenIds[i].toString(),
        token0Symbol: token0Symbol as string,
        token1Symbol: token1Symbol as string,
        fee: pos.fee,
        inRange,
        amount0,
        amount1,
        usdValue,
        token0UsdPrice: price0,
        token1UsdPrice: price1,
      });
    } catch {
      // Skip positions that fail to decode
    }
  }

  return results;
}

async function fetchTokenPrice(address: `0x${string}`): Promise<number | null> {
  try {
    const res = await fetch(`${BLOCKSCOUT}/tokens/${address}`, { next: { revalidate: 300 } });
    const data = await res.json();
    const rate = parseFloat(data.exchange_rate ?? "0");
    return rate > 0 ? rate : null;
  } catch {
    return null;
  }
}
