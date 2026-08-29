/**
 * Expected model for the "Spot market" section on https://mb.io/en/explore.
 * Derived from a live recon run (scripts/recon-trading.mjs), not documentation.
 *
 * Note: the public site is served market data from static.mb-dev.io (dev/mock),
 * so prices, row counts and per-row gain/loss direction are NOT stable and every
 * row currently renders with the "down" colour. Assertions therefore check
 * structure and field shape, and verify category grouping by content rather than
 * by the sign of the % change.
 */

export const EXPLORE_PATH = '/en/explore';

export const SECTION_HEADING = 'Spot market';
export const TABLE_HEADING = "Today's top crypto prices";

/** The category tabs that group the trading pairs. */
export const CATEGORIES = ['Hot', 'Gainers', 'Losers'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Class token added to the active category tab. */
export const ACTIVE_TAB_TOKEN = 'bg-lighter';

/** A few pairs that should always be present somewhere in the section. */
export const WELL_KNOWN_SYMBOLS = ['BTC', 'ETH'] as const;

/** Field-shape validators for a single trading-pair row. */
export const FIELD = {
  /** Ticker symbol, e.g. BTC, DOGE, MBG. */
  symbol: /^[A-Z0-9]{2,10}$/,
  /** Fiat price, e.g. $0.10, $77,627.05. */
  price: /^\$[\d,]+(\.\d+)?$/,
  /** 24h change magnitude, e.g. 2.45%. */
  change: /^\d+(\.\d+)?%$/,
  /** Per-pair detail link, e.g. /explore/BTC. */
  coinLink: /^\/explore\/[A-Z0-9]+$/,
  /** Coin icon asset. */
  iconSrc: /coins\/.+\.(png|svg|webp)/i,
} as const;

/** How many top rows to deep-check for data fields. */
export const ROWS_TO_VERIFY = 5;
