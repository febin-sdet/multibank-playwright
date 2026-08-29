import { test, expect } from '@playwright/test';
import { SpotMarket } from '../pages/spot-market';
import {
  CATEGORIES,
  FIELD,
  ROWS_TO_VERIFY,
  TABLE_HEADING,
  WELL_KNOWN_SYMBOLS,
} from '../data/spot-market';

/**
 * Scenario 2 — Trading Functionality (Spot market section, /en/explore)
 *   • Spot trading section renders and displays trading pairs
 *   • Trading pairs are correctly grouped into categories
 *   • Trading pair entries contain the expected data fields
 */
test.describe('Scenario 2: Trading Functionality', () => {
  let spot: SpotMarket;

  test.beforeEach(async ({ page }) => {
    spot = new SpotMarket(page);
    await spot.goto();
  });

  test('spot trading section renders and displays trading pairs', async () => {
    await expect(spot.section).toBeVisible();
    await expect(spot.heading).toBeVisible();
    await expect(spot.description).toContainText(/spot market/i);
    await expect(spot.section.getByRole('heading', { name: TABLE_HEADING })).toBeVisible();

    // The pair table is populated.
    await expect(spot.table).toBeVisible();
    const rowCount = await spot.rows.count();
    expect(rowCount, 'trading-pair rows rendered').toBeGreaterThanOrEqual(5);

    // Rows resolve to real ticker symbols, incl. well-known ones across the categories.
    const seen = new Set<string>();
    for (const category of CATEGORIES) {
      await spot.selectCategory(category);
      for (const s of await spot.visibleSymbols()) {
        expect(s, `symbol "${s}" shape`).toMatch(FIELD.symbol);
        seen.add(s);
      }
    }
    for (const known of WELL_KNOWN_SYMBOLS) {
      expect(seen, `${known} present in section`).toContain(known);
    }
  });

  test.describe('trading pairs are correctly grouped into categories', () => {
    test('the category tabs exist and are exclusively selectable', async () => {
      for (const category of CATEGORIES) {
        await expect(spot.tab(category), `${category} tab visible`).toBeVisible();
      }
      for (const category of CATEGORIES) {
        await spot.selectCategory(category);
        expect(await spot.activeCategory(), `${category} is the only active tab`).toBe(category);
      }
    });

    test('each category groups a non-empty, distinct set of pairs', async () => {
      const bySymbols: Record<string, string[]> = {};
      for (const category of CATEGORIES) {
        await spot.selectCategory(category);
        const symbols = await spot.visibleSymbols();
        expect(symbols.length, `${category} not empty`).toBeGreaterThanOrEqual(5);
        expect(new Set(symbols).size, `${category} has no duplicate pairs`).toBe(symbols.length);
        bySymbols[category] = symbols;
      }

      // Grouping is meaningful: the categories are not all the same list.
      const [hot, gainers, losers] = CATEGORIES.map((c) => bySymbols[c].join(','));
      expect(
        new Set([hot, gainers, losers]).size,
        'categories yield different pair groupings',
      ).toBeGreaterThan(1);

      // Losers surfaces at least one pair that "Hot" does not.
      const hotSet = new Set(bySymbols.Hot);
      expect(
        bySymbols.Losers.some((s) => !hotSet.has(s)),
        'Losers is a distinct grouping from Hot',
      ).toBe(true);
    });
  });

  test('trading pair entries contain the expected data fields', async () => {
    const toCheck = Math.min(ROWS_TO_VERIFY, await spot.rows.count());
    expect(toCheck).toBeGreaterThan(0);

    for (let i = 0; i < toCheck; i++) {
      const row = spot.row(i);
      const label = `row ${i}`;

      const symbol = (await row.symbol.innerText()).trim();
      expect(symbol, `${label} symbol`).toMatch(FIELD.symbol);

      await expect(row.name, `${label} name`).toBeVisible();
      expect((await row.name.innerText()).trim().length, `${label} name non-empty`).toBeGreaterThan(0);

      // Icon.
      await expect(row.icon, `${label} icon`).toBeVisible();
      expect(await row.icon.getAttribute('src'), `${label} icon src`).toMatch(FIELD.iconSrc);
      expect(await row.icon.getAttribute('alt'), `${label} icon alt`).toBe(symbol);

      // Detail link.
      expect(await row.coinLink.getAttribute('href'), `${label} coin link`).toMatch(FIELD.coinLink);
      expect(await row.coinLink.getAttribute('href')).toContain(`/${symbol}`);

      // Price.
      await expect(row.price, `${label} price`).toBeVisible();
      expect((await row.price.innerText()).trim(), `${label} price shape`).toMatch(FIELD.price);

      // 24h change.
      await expect(row.change, `${label} change`).toBeVisible();
      expect((await row.change.innerText()).trim(), `${label} change shape`).toMatch(FIELD.change);

      // 7-day sparkline.
      await expect(row.chart, `${label} sparkline`).toBeVisible();
      await expect(row.chart.locator('svg'), `${label} sparkline svg`).toBeVisible();
    }
  });
});
