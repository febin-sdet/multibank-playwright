import { expect, type Locator, type Page } from '@playwright/test';
import {
  ACTIVE_TAB_TOKEN,
  type Category,
  EXPLORE_PATH,
  SECTION_HEADING,
} from '../data/spot-market';

/** One trading-pair row in the Spot market table. */
export class PairRow {
  constructor(private readonly root: Locator) {}

  get symbol() {
    return this.root.locator('td[id$="_displayName-td"] span').first();
  }
  get name() {
    return this.root.locator('td[id$="_displayName-td"] span').nth(1);
  }
  get coinLink() {
    return this.root.locator('td[id$="_displayName-td"] a');
  }
  get icon() {
    return this.root.locator('td[id$="_displayName-td"] img');
  }
  get price() {
    return this.root.locator('td[id$="_price-td"]');
  }
  get change() {
    return this.root.locator('td[id$="_change-td"] span');
  }
  /** 7-day sparkline cell. */
  get chart() {
    return this.root.locator('td[id$="_week-chart-td"] .recharts-responsive-container');
  }

  async symbolText() {
    return (await this.symbol.innerText()).trim();
  }
}

/**
 * Page object for the "Spot market" section of the Explore page.
 */
export class SpotMarket {
  readonly page: Page;
  readonly section: Locator;
  readonly heading: Locator;
  readonly description: Locator;
  readonly tabs: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.section = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: SECTION_HEADING, exact: true }) });
    this.heading = this.section.getByRole('heading', { name: SECTION_HEADING, exact: true });
    this.description = this.section.locator('p').first();
    this.tabs = this.section.getByRole('button');
    this.table = this.section.locator('table');
    // Real data rows carry the per-column <td> ids; skip the virtualiser spacer row.
    this.rows = this.table.locator('tbody tr:has(td[id$="_price-td"])');
  }

  async goto() {
    await this.page.goto(EXPLORE_PATH);
    await this.page.waitForLoadState('domcontentloaded');
    await this.heading.scrollIntoViewIfNeeded();
    await expect(this.rows.first()).toBeVisible();
  }

  tab(category: Category): Locator {
    return this.section.getByRole('button', { name: category, exact: true });
  }

  row(index: number): PairRow {
    return new PairRow(this.rows.nth(index));
  }

  /** Select a category and wait for the table to settle. */
  async selectCategory(category: Category) {
    await this.tab(category).click();
    await expect(this.tab(category)).toHaveClass(new RegExp(`\\b${ACTIVE_TAB_TOKEN}\\b`));
    await expect(this.rows.first()).toBeVisible();
    await expect.poll(() => this.rows.count()).toBeGreaterThan(0);
  }

  /** Ordered list of ticker symbols currently shown. */
  async visibleSymbols(): Promise<string[]> {
    const count = await this.rows.count();
    const symbols: string[] = [];
    for (let i = 0; i < count; i++) symbols.push(await this.row(i).symbolText());
    return symbols;
  }

  async activeCategory(): Promise<Category | null> {
    for (const name of ['Hot', 'Gainers', 'Losers'] as Category[]) {
      const cls = (await this.tab(name).getAttribute('class')) ?? '';
      if (new RegExp(`\\b${ACTIVE_TAB_TOKEN}\\b`).test(cls)) return name;
    }
    return null;
  }
}
