import { Address } from "@graphprotocol/graph-ts";
import { UniswapV2Factory } from "./../../generated/templates/UniswapV2Pair/UniswapV2Factory";
import { NULL_ETH_ADDRESS, UNISWAP_V2_FACTORY } from "./contractAddresses";

export function getUniswapPool(
  token0Address: Address,
  token1Address: Address
): string {
  let contract = UniswapV2Factory.bind(Address.fromString(UNISWAP_V2_FACTORY));
  let poolAddress = NULL_ETH_ADDRESS;
  let poolAddressResult = contract.try_getPair(token0Address, token1Address);
  if (!poolAddressResult.reverted) {
    poolAddress = poolAddressResult.value.toHexString();
  }
  return poolAddress;
}
