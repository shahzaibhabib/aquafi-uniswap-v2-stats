import { ethereum } from "@graphprotocol/graph-ts";
import {
  AquaFi,
  AquaFiDayData,
  Pool,
  PoolDayData,
} from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "./constants";
import { AQUA_UNISWAP_V2_HANDLER } from "./contractAddresses";

export function updateAquaFiUniswapV2DayData(event: ethereum.Event): void {
  let aquaFiUniswapV2 = AquaFi.load(AQUA_UNISWAP_V2_HANDLER.toHexString());
  if (aquaFiUniswapV2 == null) return; // HOTFIX

  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400; // rounded
  let dayStartTimestamp = dayID * 86400;

  let aquaFiUniswapV2DayData = AquaFiDayData.load(dayID.toString());
  if (aquaFiUniswapV2DayData == null) {
    aquaFiUniswapV2DayData = new AquaFiDayData(dayID.toString());
    aquaFiUniswapV2DayData.date = dayStartTimestamp;
    aquaFiUniswapV2DayData.totalValueLockedDrivedUSD = ZERO_BD;
    aquaFiUniswapV2DayData.activeTotalValueLockedDrivedETH = ZERO_BD;
    aquaFiUniswapV2DayData.activeTotalValueLockedDrivedUSD = ZERO_BD;
    aquaFiUniswapV2DayData.aquaPremiumAmount = ZERO_BD;
    aquaFiUniswapV2DayData.aquaPremiumAmountDrivedETH = ZERO_BD;
    aquaFiUniswapV2DayData.aquaPremiumAmountDrivedUSD = ZERO_BD;
    aquaFiUniswapV2DayData.aquaAmount = ZERO_BD;
    aquaFiUniswapV2DayData.aquaAmountDrivedETH = ZERO_BD;
    aquaFiUniswapV2DayData.aquaAmountDrivedUSD = ZERO_BD;
    aquaFiUniswapV2DayData.stakeCount = ZERO_BI;
    aquaFiUniswapV2DayData.unstakeCount = ZERO_BI;
  }

  aquaFiUniswapV2DayData.totalValueLockedDrivedUSD =
    aquaFiUniswapV2.totalValueLockedDrivedUSD;
  aquaFiUniswapV2DayData.activeTotalValueLockedDrivedUSD =
    aquaFiUniswapV2.activeTotalValueLockedDrivedUSD;

  aquaFiUniswapV2DayData.aquaPremiumAmount = aquaFiUniswapV2.aquaPremiumAmount;
  aquaFiUniswapV2DayData.aquaPremiumAmountDrivedUSD =
    aquaFiUniswapV2.aquaPremiumAmountDrivedUSD;

  aquaFiUniswapV2DayData.aquaAmount = aquaFiUniswapV2.aquaAmount;
  aquaFiUniswapV2DayData.aquaAmountDrivedUSD =
    aquaFiUniswapV2.aquaAmountDrivedUSD;

  aquaFiUniswapV2DayData.stakeCount = aquaFiUniswapV2.stakeCount;
  aquaFiUniswapV2DayData.unstakeCount = aquaFiUniswapV2.unstakeCount;

  aquaFiUniswapV2DayData.save();
}

export function updatePoolDayData(event: ethereum.Event, _pool: Pool): void {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400; // rounded
  let dayStartTimestamp = dayID * 86400;
  let dayPoolId = _pool.id
    .toString()
    .concat("-")
    .concat(dayID.toString());

  let poolDayData = PoolDayData.load(dayPoolId.toString());
  if (poolDayData == null) {
    poolDayData = new PoolDayData(dayPoolId.toString());
    poolDayData.date = dayStartTimestamp;
    poolDayData.pool = _pool.id;
    poolDayData.aquaPremium = _pool.aquaPremium;
    poolDayData.aquaPremiumAmount = ZERO_BD;
    poolDayData.aquaPremiumAmountDrivedUSD = ZERO_BD;
    poolDayData.aquaAmount = ZERO_BD;
    poolDayData.aquaAmountDrivedUSD = ZERO_BD;
    poolDayData.totalValueLockedDrivedUSD = ZERO_BD;
    poolDayData.stakeCount = ZERO_BI;
    poolDayData.unstakeCount = ZERO_BI;
    poolDayData.activeStakeCount = ZERO_BI;
  }

  poolDayData.aquaPremiumAmount = _pool.aquaPremiumAmount;
  poolDayData.aquaPremiumAmountDrivedUSD = _pool.aquaPremiumAmountDrivedUSD;

  poolDayData.aquaAmount = _pool.aquaAmount;
  poolDayData.aquaAmountDrivedUSD = _pool.aquaAmountDrivedUSD;

  poolDayData.totalValueLockedDrivedUSD = _pool.totalValueLockedDrivedUSD;

  poolDayData.stakeCount = _pool.stakeCount;
  poolDayData.unstakeCount = _pool.unstakeCount;

  poolDayData.activeStakeCount = _pool.activeStakeCount;

  poolDayData.save();
}
