// Uniswap V3 Tick & Liquidity Math
// Standard implementation from Uniswap V3 TickMath.sol

const Q96 = 1n << 96n;
const Q128 = 1n << 128n;

/**
 * Returns sqrtPriceX96 for a given tick.
 * Direct port of Uniswap V3 TickMath.getSqrtRatioAtTick
 */
export function getSqrtRatioAtTick(tick: number): bigint {
  const absTick = tick < 0 ? -tick : tick;

  let ratio: bigint = absTick & 0x1
    ? 0xfffcb933bd6fad37aa2d162d1a594001n
    : 0x100000000000000000000000000000000n;

  if (absTick & 0x2)      ratio = (ratio * 0xfff97272373d413259a46990580e213an)    >> 128n;
  if (absTick & 0x4)      ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdccn)    >> 128n;
  if (absTick & 0x8)      ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0n)    >> 128n;
  if (absTick & 0x10)     ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644n)    >> 128n;
  if (absTick & 0x20)     ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0n)    >> 128n;
  if (absTick & 0x40)     ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861n)    >> 128n;
  if (absTick & 0x80)     ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053n)    >> 128n;
  if (absTick & 0x100)    ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4n)    >> 128n;
  if (absTick & 0x200)    ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54n)    >> 128n;
  if (absTick & 0x400)    ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3n)    >> 128n;
  if (absTick & 0x800)    ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9n)    >> 128n;
  if (absTick & 0x1000)   ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825n)    >> 128n;
  if (absTick & 0x2000)   ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5n)    >> 128n;
  if (absTick & 0x4000)   ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7n)    >> 128n;
  if (absTick & 0x8000)   ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6n)    >> 128n;
  if (absTick & 0x10000)  ratio = (ratio * 0x9aa508b5b7a84e101a108615b8ef7f4n)     >> 128n;
  if (absTick & 0x20000)  ratio = (ratio * 0x5d6af8dedb81196699c329225ee604n)      >> 128n;
  if (absTick & 0x40000)  ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98n)        >> 128n;
  if (absTick & 0x80000)  ratio = (ratio * 0x48a170391f7dc42444e8fa2n)             >> 128n;

  if (tick > 0) ratio = (2n ** 256n - 1n) / ratio;

  // Shift to Q64.96
  return (ratio >> 32n) + ((ratio & 0xffffffffn) === 0n ? 0n : 1n);
}

/** Amount of token0 between two sqrtPrice points */
export function getAmount0ForLiquidity(
  sqrtRatioCurrentX96: bigint,
  sqrtRatioUpperX96: bigint,
  liquidity: bigint
): bigint {
  if (sqrtRatioCurrentX96 >= sqrtRatioUpperX96 || liquidity === 0n) return 0n;
  return (liquidity * Q96 * (sqrtRatioUpperX96 - sqrtRatioCurrentX96)) /
    sqrtRatioUpperX96 / sqrtRatioCurrentX96;
}

/** Amount of token1 between two sqrtPrice points */
export function getAmount1ForLiquidity(
  sqrtRatioLowerX96: bigint,
  sqrtRatioCurrentX96: bigint,
  liquidity: bigint
): bigint {
  if (sqrtRatioCurrentX96 <= sqrtRatioLowerX96 || liquidity === 0n) return 0n;
  return (liquidity * (sqrtRatioCurrentX96 - sqrtRatioLowerX96)) / Q96;
}

/**
 * Compute the amounts of token0 and token1 for a given V3 position.
 * Also adds tokensOwed (unclaimed fees).
 */
export function getPositionAmounts(
  sqrtPriceX96: bigint,
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
  liquidity: bigint,
  tokensOwed0: bigint,
  tokensOwed1: bigint
): { amount0: bigint; amount1: bigint; inRange: boolean } {
  const sqrtPriceLowerX96 = getSqrtRatioAtTick(tickLower);
  const sqrtPriceUpperX96 = getSqrtRatioAtTick(tickUpper);

  const inRange = tickCurrent >= tickLower && tickCurrent < tickUpper;

  let amount0 = 0n;
  let amount1 = 0n;

  if (tickCurrent < tickLower) {
    // Below range: all token0
    amount0 = getAmount0ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);
  } else if (tickCurrent < tickUpper) {
    // In range: both tokens
    amount0 = getAmount0ForLiquidity(sqrtPriceX96, sqrtPriceUpperX96, liquidity);
    amount1 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceX96, liquidity);
  } else {
    // Above range: all token1
    amount1 = getAmount1ForLiquidity(sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity);
  }

  // Add unclaimed fees
  amount0 += tokensOwed0;
  amount1 += tokensOwed1;

  return { amount0, amount1, inRange };
}

/** Convert Q64.96 sqrtPrice to a human-readable price ratio */
export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  decimals0: number,
  decimals1: number
): number {
  const price = Number((sqrtPriceX96 * sqrtPriceX96 * BigInt(10 ** decimals0)) / (Q96 * Q96)) / 10 ** decimals1;
  return price;
}
