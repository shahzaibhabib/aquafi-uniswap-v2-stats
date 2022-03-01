import { Sync } from "./../../generated/templates/UniswapV2Pair/UniswapV2Pair";
import { Bundle, Pool, Token } from "../../generated/schema";
import { convertTokenToDecimal } from "../utils/helper";
import { findWethPerToken, getEthPriceInUSD } from "../utils/pricing";

export function handleSync(event: Sync): void {
  let pool = Pool.load(event.address.toHexString());
  if (pool == null) return;

  let token0 = Token.load(pool.token0);
  if (token0 == null) return;
  let token1 = Token.load(pool.token1);
  if (token1 == null) return;

  pool.reserve0 = convertTokenToDecimal(event.params.reserve0, token0.decimals);
  pool.reserve1 = convertTokenToDecimal(event.params.reserve1, token1.decimals);
  pool.save();

  // update eth price now that reserves could have changed
  let bundle = Bundle.load("1");
  if (bundle) {
    bundle.ethPriceUSD = getEthPriceInUSD();
    bundle.save();
    token0.drivedETH = findWethPerToken(token0.id);
    token1.drivedETH = findWethPerToken(token1.id);

    token0.drivedUSD = token0.drivedETH.times(bundle.ethPriceUSD);
    token1.drivedUSD = token1.drivedETH.times(bundle.ethPriceUSD);
  }

  token0.save();
  token1.save();
}
