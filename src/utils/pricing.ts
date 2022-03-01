import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Pool, Token } from "../../generated/schema";
import { ONE_BD, ZERO_BD } from "./constants";
import { USDC_WETH_ADDRESS, WETH_TOKEN_ADDRESS } from "./contractAddresses";
import { getUniswapPool } from "./factory";

export function getEthPriceInUSD(): BigDecimal {
  let USDC_WETH_PAIR = Pool.load(USDC_WETH_ADDRESS);

  if (USDC_WETH_PAIR != null) {
    let reserve0 = USDC_WETH_PAIR.reserve0;
    let reserve1 = USDC_WETH_PAIR.reserve1;
    if (reserve0.gt(ZERO_BD) && reserve1.gt(ZERO_BD)) {
      let usdPerWeth = ZERO_BD;
      let token0 = Token.load(USDC_WETH_PAIR.token0);
      if (token0 != null) {
        let token0Symbol = token0.symbol;
        if (token0Symbol == "WETH") {
          usdPerWeth = reserve1.div(reserve0);
        } else {
          usdPerWeth = reserve0.div(reserve1);
        }
      }

      return usdPerWeth;
    } else return ZERO_BD;
  } else return ZERO_BD;
}

export function findWethPerToken(tokenAddress: string): BigDecimal {
  // STEP: 1 - IF THE TOKEN IS WETH
  if (
    Address.fromString(tokenAddress).equals(
      Address.fromString(WETH_TOKEN_ADDRESS)
    )
  ) {
    return ONE_BD;
  }
  // STEP: 2 - IF THE TOKEN IS NOT WETH

  // load pool from entity
  // NOTE: expects pair of every token exists with WETH and is also whitelisted by the protocol
  let poolAddress = getUniswapPool(
    Address.fromString(tokenAddress),
    Address.fromString(WETH_TOKEN_ADDRESS)
  );

  let pool = Pool.load(poolAddress);
  if (pool == null) return ZERO_BD;

  let reserve0 = pool.reserve0;
  let reserve1 = pool.reserve1;

  let token0Address = pool.token0;
  let wethPerToken = ZERO_BD;
  let token0 = Token.load(token0Address);
  if (token0 != null) {
    let token0Symbol = token0.symbol;
    if (reserve0.gt(ZERO_BD) && reserve1.gt(ZERO_BD)) {
      if (token0Symbol == "WETH") {
        wethPerToken = reserve0.div(reserve1);
      } else {
        wethPerToken = reserve1.div(reserve0);
      }
    }
  }

  return wethPerToken;
}
