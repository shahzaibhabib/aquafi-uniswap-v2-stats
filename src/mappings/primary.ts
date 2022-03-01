import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  Staked,
  Unstaked,
} from "./../../generated/AquaFiPrimary/AquaFiPrimary";
import { User, Stake, Pool, Token, Unstake } from "./../../generated/schema";
import {
  updateAquaFiUniswapV2DayData,
  updatePoolDayData,
} from "../utils/intervalUpdates";
import { getLpReserves } from "../utils/pool";
import { loadAquaFiUniswapV2 } from "../utils/primary";
import { ONE_BI, ZERO_BD, ZERO_BI } from "../utils/constants";
import {
  AQUA_TOKEN_ADDRESS,
  AQUA_UNISWAP_V2_HANDLER,
} from "../utils/contractAddresses";
import { convertTokenToDecimal } from "../utils/helper";
import { loadTransaction } from "../utils/transaction";

// id staker lpValue handler depositTime contractAddress
export function handleStaked(event: Staked): void {
  // STEP 1 - filter only Uniswap V2 stakes
  if (event.params.handler.notEqual(AQUA_UNISWAP_V2_HANDLER)) return;

  // STEP 2 - load user entity
  let user = User.load(event.params.staker.toHexString());
  if (user == null) {
    user = new User(event.params.staker.toHexString());
    user.stakes = [];
    user.unstakes = [];
  }

  // STEP 3 - populate stake entity
  let stake = new Stake(event.params.id.toHexString());
  stake.transactionHash = event.transaction.hash.toHexString();
  stake.token = event.params.contractAddress.toHexString();
  stake.tokenAmount = convertTokenToDecimal(
    event.params.lpValue,
    BigInt.fromI32(18)
  );
  stake.pool = event.params.contractAddress.toHexString();
  let pool = Pool.load(event.params.contractAddress.toHexString());
  if (pool == null) return; // HOTFIX
  let token0 = Token.load(pool.token0);
  if (token0 == null) return; // HOTFIX
  let token1 = Token.load(pool.token1);
  if (token1 == null) return; // HOTFIX
  stake.aquaPremium = pool.aquaPremium;
  stake.token0 = pool.token0;
  stake.token1 = pool.token1;
  let reserves: BigDecimal[] = getLpReserves(
    event.params.contractAddress,
    event.params.lpValue
  );
  stake.reserve0 = reserves[0];
  stake.reserve1 = reserves[1];
  stake.reserve0DrivedETH = stake.reserve0.times(token0.drivedETH);
  stake.reserve1DrivedETH = stake.reserve1.times(token1.drivedETH);
  stake.reserve0DrivedUSD = stake.reserve0.times(token0.drivedUSD);
  stake.reserve1DrivedUSD = stake.reserve1.times(token1.drivedUSD);
  stake.totalReservesDrivedUSD = stake.reserve0DrivedUSD.plus(
    stake.reserve1DrivedUSD
  );
  stake.staker = event.params.staker.toHexString();
  stake.stakeTime = event.params.depositTime;
  stake.handler = event.params.handler.toHexString();
  stake.active = true;
  stake.save();

  // STEP 4 - update pool entity
  pool.reserve0Staked = pool.reserve0Staked.plus(stake.reserve0);
  pool.reserve1Staked = pool.reserve1Staked.plus(stake.reserve1);

  let poolStakes = pool.stakes;
  if (poolStakes == null) return; // HOTFIX
  poolStakes.push(stake.id);
  pool.stakes = poolStakes;
  pool.totalValueLockedDrivedUSD = pool.totalValueLockedDrivedUSD.plus(
    stake.totalReservesDrivedUSD
  );
  pool.stakeCount = pool.stakeCount.plus(ONE_BI);
  pool.activeStakeCount = pool.activeStakeCount.plus(ONE_BI);
  pool.save();

  // STEP 5 - add stake to the user entity
  let userStakes = user.stakes;
  if (userStakes == null) return; // HOTFIX
  userStakes.push(stake.id);
  user.stakes = userStakes;
  user.save();

  // STEP 6 - update transaction entity
  let transaction = loadTransaction(event);
  let transactionStakes = transaction.stakes;
  if (transactionStakes == null) return; // HOTFIX
  transactionStakes.push(stake.id);
  transaction.stakes = transactionStakes;
  transaction.save();

  // STEP 7 - update AquaFiUniswapV2 entity
  let aquaFiUniswapV2 = loadAquaFiUniswapV2();
  if (aquaFiUniswapV2 == null) return; // HOTFIX
  aquaFiUniswapV2.totalValueLockedDrivedUSD = aquaFiUniswapV2.totalValueLockedDrivedUSD.plus(
    stake.totalReservesDrivedUSD
  );
  aquaFiUniswapV2.activeTotalValueLockedDrivedUSD = aquaFiUniswapV2.activeTotalValueLockedDrivedUSD.plus(
    stake.totalReservesDrivedUSD
  );
  aquaFiUniswapV2.stakeCount = aquaFiUniswapV2.stakeCount.plus(ONE_BI);
  aquaFiUniswapV2.activeStakeCount = aquaFiUniswapV2.activeStakeCount.plus(
    ONE_BI
  );
  aquaFiUniswapV2.save();

  // STEP 8 - update AquaFiUniswapV2DayData entity
  updateAquaFiUniswapV2DayData(event);

  // STEP 9 - update PoolDayData entity
  updatePoolDayData(event, pool as Pool);
}

// id token tokenIdOrAmount aquaPremium aquaAmount amount
export function handleUnstaked(event: Unstaked): void {
  // STEP 1 - filter only Uniswap V2 unstakes
  let stake = Stake.load(event.params.id.toHexString());
  if (stake == null) return;

  // double check
  if (Address.fromString(stake.handler).notEqual(AQUA_UNISWAP_V2_HANDLER))
    return;

  // STEP 2 - load user entity
  let user = User.load(stake.staker);
  if (user == null) return; // HOTFIX

  // STEP 3 - populate unstake entity
  let unstake = new Unstake(event.params.id.toHexString());
  let aquaToken = Token.load(AQUA_TOKEN_ADDRESS);
  if (aquaToken == null) return; // HOTFIX
  unstake.transactionHash = event.transaction.hash.toHexString();
  unstake.token = stake.token;
  unstake.tokenAmount = convertTokenToDecimal(
    event.params.tokenIdOrAmount,
    BigInt.fromI32(18)
  );
  unstake.pool = stake.pool;
  unstake.aquaPremium = event.params.aquaPremium;
  unstake.aquaPremiumAmount = convertTokenToDecimal(
    event.params.aquaAmount,
    BigInt.fromI32(18)
  );
  unstake.aquaPremiumAmountDrivedUSD = unstake.aquaPremiumAmount.times(
    aquaToken.drivedUSD
  );
  unstake.aquaAmount = convertTokenToDecimal(
    event.params.amount,
    BigInt.fromI32(18)
  );
  unstake.aquaAmountDrivedUSD = unstake.aquaAmount.times(aquaToken.drivedUSD);
  unstake.handler = stake.handler;
  unstake.token0 = stake.token0;
  unstake.token1 = stake.token1;
  let reserves: BigDecimal[] = getLpReserves(
    Address.fromString(stake.token),
    event.params.tokenIdOrAmount
  );
  unstake.reserve0 = reserves[0];
  unstake.reserve1 = reserves[1];
  let token0 = Token.load(unstake.token0);
  if (token0 == null) return; // HOTFIX
  let token1 = Token.load(unstake.token1);
  if (token1 == null) return; // HOTFIX
  unstake.reserve0DrivedETH = unstake.reserve0.times(token0.drivedETH);
  unstake.reserve1DrivedETH = unstake.reserve1.times(token1.drivedETH);
  unstake.reserve0DrivedUSD = unstake.reserve0.times(token0.drivedUSD);
  unstake.reserve1DrivedUSD = unstake.reserve1.times(token1.drivedUSD);
  unstake.totalReservesDrivedUSD = unstake.reserve0DrivedUSD.plus(
    unstake.reserve1DrivedUSD
  );
  unstake.lpFeeGeneratedDrivedETH = ZERO_BD;
  unstake.lpFeeGeneratedDrivedUSD = ZERO_BD;
  unstake.staker = stake.staker;
  unstake.unstakeTime = event.block.timestamp;

  stake.active = stake.tokenAmount.minus(unstake.tokenAmount).equals(ZERO_BD)
    ? false
    : true;
  stake.save();
  unstake.save();

  // STEP 4 - update pool entity
  let pool = Pool.load(unstake.pool);
  if (pool == null) return; // HOTFIX

  pool.reserve0Staked = pool.reserve0Staked.minus(
    !stake.active ? stake.reserve0 : unstake.reserve0
  );
  pool.reserve1Staked = pool.reserve1Staked.minus(
    !stake.active ? stake.reserve1 : unstake.reserve1
  );

  let poolUnstakes = pool.unstakes;
  if (poolUnstakes == null) return; // HOTFIX
  poolUnstakes.push(unstake.id);
  pool.unstakes = poolUnstakes;
  pool.aquaPremiumAmount = pool.aquaPremiumAmount.plus(
    unstake.aquaPremiumAmount
  );
  pool.aquaPremiumAmountDrivedUSD = pool.aquaPremiumAmountDrivedUSD.plus(
    unstake.aquaPremiumAmountDrivedUSD
  );

  pool.aquaAmount = pool.aquaAmount.plus(unstake.aquaAmount);
  pool.aquaAmountDrivedUSD = pool.aquaAmountDrivedUSD.plus(
    unstake.aquaAmountDrivedUSD
  );

  let ind: BigDecimal = pool.totalValueLockedDrivedUSD.minus(
    unstake.totalReservesDrivedUSD
  );
  pool.totalValueLockedDrivedUSD = pool.totalValueLockedDrivedUSD
    .minus(unstake.totalReservesDrivedUSD)
    .minus(ind);

  pool.activeStakeCount = pool.activeStakeCount.minus(ONE_BI);
  pool.unstakeCount = pool.unstakeCount.plus(ONE_BI);

  pool.save();

  // STEP 5 - add unstake to the user entity
  let userUnstakes = user.unstakes;
  if (userUnstakes == null) return; // HOTFIX
  userUnstakes.push(unstake.id);
  user.unstakes = userUnstakes;
  user.save();

  // STEP 6 - update transaction entity
  let transaction = loadTransaction(event);
  let transactionUnstakes = transaction.unstakes;
  if (transactionUnstakes == null) return; // HOTFIX
  transactionUnstakes.push(unstake.id);
  transaction.unstakes = transactionUnstakes;
  transaction.save();

  // STEP 7 - update AquaFiUniswapV2 entity
  let aquaFiUniswapV2 = loadAquaFiUniswapV2();
  if (aquaFiUniswapV2 == null) return; // HOTFIX
  let index: BigDecimal = aquaFiUniswapV2.activeTotalValueLockedDrivedUSD.minus(
    unstake.totalReservesDrivedUSD
  );
  aquaFiUniswapV2.activeTotalValueLockedDrivedUSD = aquaFiUniswapV2.activeTotalValueLockedDrivedUSD
    .minus(unstake.totalReservesDrivedUSD)
    .minus(index);

  aquaFiUniswapV2.aquaPremiumAmount = aquaFiUniswapV2.aquaPremiumAmount.plus(
    unstake.aquaPremiumAmount
  );
  aquaFiUniswapV2.aquaPremiumAmountDrivedUSD = aquaFiUniswapV2.aquaPremiumAmountDrivedUSD.plus(
    unstake.aquaPremiumAmountDrivedUSD
  );

  aquaFiUniswapV2.aquaAmount = aquaFiUniswapV2.aquaAmount.plus(
    unstake.aquaAmount
  );
  aquaFiUniswapV2.aquaAmountDrivedUSD = aquaFiUniswapV2.aquaAmountDrivedUSD.plus(
    unstake.aquaAmountDrivedUSD
  );

  aquaFiUniswapV2.activeStakeCount = aquaFiUniswapV2.activeStakeCount.minus(
    ONE_BI
  );
  aquaFiUniswapV2.unstakeCount = aquaFiUniswapV2.unstakeCount.plus(ONE_BI);
  aquaFiUniswapV2.save();

  // STEP 8 - update AquaFiUniswapV2DayData entity
  updateAquaFiUniswapV2DayData(event);

  // STEP 9 - update PoolDayData entity
  updatePoolDayData(event, pool as Pool);
}
