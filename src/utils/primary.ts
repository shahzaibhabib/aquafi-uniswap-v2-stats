import { AquaFi } from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "./constants";
import { AQUA_UNISWAP_V2_HANDLER } from "./contractAddresses";

export function loadAquaFiUniswapV2(): AquaFi | null {
  let aquaFiUniswapV2 = AquaFi.load(AQUA_UNISWAP_V2_HANDLER.toHexString());
  if (aquaFiUniswapV2 == null) {
    aquaFiUniswapV2 = new AquaFi(AQUA_UNISWAP_V2_HANDLER.toHexString());
    aquaFiUniswapV2.totalValueLockedDrivedUSD = ZERO_BD;
    aquaFiUniswapV2.activeTotalValueLockedDrivedUSD = ZERO_BD;
    aquaFiUniswapV2.aquaPremiumAmount = ZERO_BD;
    aquaFiUniswapV2.aquaPremiumAmountDrivedUSD = ZERO_BD;
    aquaFiUniswapV2.aquaAmount = ZERO_BD;
    aquaFiUniswapV2.aquaAmountDrivedUSD = ZERO_BD;
    aquaFiUniswapV2.stakeCount = ZERO_BI;
    aquaFiUniswapV2.unstakeCount = ZERO_BI;
    aquaFiUniswapV2.activeStakeCount = ZERO_BI;
  }
  return aquaFiUniswapV2;
}
