import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { UniswapV2Pair } from "./../../generated/AquaFiUniswapV2Handler/UniswapV2Pair";
import { UniswapV2Pair as PrimaryUniswapV2Pair } from "./../../generated/AquaFiPrimary/UniswapV2Pair";
import { ZERO_BD } from "./constants";
import { Pool, Token } from "../../generated/schema";
import { convertTokenToDecimal } from "./helper";

export function fetchTokenAddressesOfPool(poolAddress: Address): string[] {
  let contract = UniswapV2Pair.bind(poolAddress);

  let token0 = "unknown";
  let token1 = "unknown";

  let token0Result = contract.try_token0();
  let token1Result = contract.try_token1();

  token0 = token0Result.value.toHexString();
  token1 = token1Result.value.toHexString();

  return [token0, token1];
}

export function getLpReserves(
  tokenAddress: Address,
  tokenAmount: BigInt
): BigDecimal[] {
  let contract = PrimaryUniswapV2Pair.bind(tokenAddress);
  let totalSupply = contract.totalSupply();
  let reserves = contract.getReserves();

  let poolReserve0 = reserves.value0; // reserve0
  let poolReserve1 = reserves.value1; // reserve1

  // caluclating reserve0 and reserve1 againt lpToken Amount
  let res0 = tokenAmount.times(poolReserve0).div(totalSupply);
  let res1 = tokenAmount.times(poolReserve1).div(totalSupply);

  let reserve0 = ZERO_BD;
  let reserve1 = ZERO_BD;

  let pool = Pool.load(tokenAddress.toHexString());
  if (pool) {
    let token0 = Token.load(pool.token0);
    let token1 = Token.load(pool.token1);
    if (token0 && token1) {
      let token0Decimals = token0.decimals;
      let token1Decimals = token1.decimals;
      reserve0 = convertTokenToDecimal(res0, token0Decimals);
      reserve1 = convertTokenToDecimal(res1, token1Decimals);
    }
  }

  return [reserve0, reserve1];
}
