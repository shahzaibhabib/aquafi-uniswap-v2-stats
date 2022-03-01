import { Address } from "@graphprotocol/graph-ts";
import { ZERO_BD, ZERO_BI } from "../utils/constants";
import { fetchTokenAddressesOfPool } from "../utils/pool";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../utils/token";
import {
  PoolAdded,
  PoolPremiumUpdated,
  PoolStatusUpdated,
} from "./../../generated/AquaFiUniswapV2Handler/AquaFiUniswapV2Handler";
import { UniswapV2Pair as UniswapV2PairTemplate } from "./../../generated/templates";
import { Bundle, Pool, Token } from "./../../generated/schema";

export function handlePoolAdded(event: PoolAdded): void {
  // STEP: 1 - create whitelisted pool
  let pool = Pool.load(event.params.pool.toHexString());
  if (!pool) {
    pool = new Pool(event.params.pool.toHexString());
    // update pool reserves
    pool.reserve0 = ZERO_BD;
    pool.reserve1 = ZERO_BD;
    pool.reserve0Staked = ZERO_BD;
    pool.reserve1Staked = ZERO_BD;
    pool.feeTier = ZERO_BI;
    pool.aquaPremiumAmount = ZERO_BD;
    pool.aquaPremiumAmountDrivedUSD = ZERO_BD;
    pool.aquaAmount = ZERO_BD;
    pool.aquaAmountDrivedUSD = ZERO_BD;
    pool.totalValueLockedDrivedUSD = ZERO_BD;
    pool.stakes = [];
    pool.unstakes = [];
    pool.stakeCount = ZERO_BI;
    pool.activeStakeCount = ZERO_BI;
    pool.unstakeCount = ZERO_BI;
  }
  // "auqaPremium" & "previousAquaPremium" will be same on whitelisting pool for the first time
  pool.aquaPremium = event.params.aquaPremium;
  pool.previousAquaPremium = event.params.aquaPremium;
  // "status" & "previousStatus" will be same on whitelisting pool for the first time
  pool.status = event.params.status;
  pool.previousStatus = event.params.status;

  // STEP: 2 - Fetch token0 & token1 details of the pool
  let tokens = fetchTokenAddressesOfPool(event.params.pool);

  // STEP: 3A - Fetch token0 details
  let token0 = Token.load(tokens[0]);
  if (token0 == null) {
    token0 = new Token(tokens[0]);
    token0.name = fetchTokenName(Address.fromString(tokens[0]));
    token0.symbol = fetchTokenSymbol(Address.fromString(tokens[0]));
    token0.decimals = fetchTokenDecimals(Address.fromString(tokens[0]));

    token0.drivedETH = ZERO_BD;
    token0.drivedUSD = ZERO_BD;
  }
  token0.save();

  // STEP: 3B - Fetch token1 details
  let token1 = Token.load(tokens[1]);
  if (token1 == null) {
    token1 = new Token(tokens[1]);
    token1.name = fetchTokenName(Address.fromString(tokens[1]));
    token1.symbol = fetchTokenSymbol(Address.fromString(tokens[1]));
    token1.decimals = fetchTokenDecimals(Address.fromString(tokens[1]));

    token1.drivedETH = ZERO_BD;
    token1.drivedUSD = ZERO_BD;
  }
  token1.save();

  // add tokens to pools
  pool.token0 = token0.id;
  pool.token1 = token1.id;

  pool.save();

  UniswapV2PairTemplate.create(event.params.pool);

  let bundle = Bundle.load("1");
  if (bundle == null) {
    bundle = new Bundle("1");
    bundle.ethPriceUSD = ZERO_BD;
  }
  bundle.save();
}

export function handlePoolPremiumUpdated(event: PoolPremiumUpdated): void {
  let pool = Pool.load(event.params.pool.toHexString());
  if (pool == null) return;
  pool.aquaPremium = event.params.newAquaPremium;
  pool.previousAquaPremium = event.params.oldAquaPremium;
  pool.save();
}

export function handlePoolStatusUpdated(event: PoolStatusUpdated): void {
  let pool = Pool.load(event.params.pool.toHexString());
  if (pool == null) return;
  pool.status = event.params.newStatus;
  pool.previousStatus = event.params.oldStatus;
  pool.save();
}
