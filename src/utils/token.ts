import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "./../../generated/AquaFiUniswapV2Handler/ERC20";
import { ERC20NameBytes } from "./../../generated/AquaFiUniswapV2Handler/ERC20NameBytes";
import { ERC20SymbolBytes } from "./../../generated/AquaFiUniswapV2Handler/ERC20SymbolBytes";
import { isNullEthValue } from "./helper";

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  let name = "unknown";
  let nameResult = contract.try_name();

  if (nameResult.reverted) {
    let nameByesResult = contractNameBytes.try_name();
    if (!nameByesResult.reverted) {
      if (!isNullEthValue(nameByesResult.value.toHexString())) {
        name = nameByesResult.value.toString();
      }
    }
  } else {
    name = nameResult.value;
  }
  return name;
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  let symbol = "unknown";
  let symbolResult = contract.try_symbol();

  if (symbolResult.reverted) {
    let symbolBytesResult = contractSymbolBytes.try_symbol();
    if (!symbolBytesResult.reverted) {
      if (!isNullEthValue(symbolBytesResult.value.toHexString())) {
        symbol = symbolBytesResult.value.toString();
      }
    }
  } else {
    symbol = symbolResult.value;
  }

  return symbol;
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress);

  let decimals = 0;
  let decimalResult = contract.try_decimals();

  if (!decimalResult.reverted) {
    decimals = decimalResult.value;
  }

  return BigInt.fromI32(decimals);
}
