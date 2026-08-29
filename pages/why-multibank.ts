import { type Locator, type Page } from '@playwright/test';
import { WHY_MULTIBANK, WHY_MULTIBANK_PATH } from '../data/content';

/**
 * Page object for "About Us > Why MultiBank" — https://mb.io/en/company
 * (page <h1> "Why MultiBank Group?").
 */
export class WhyMultiBankPage {
  readonly page: Page;
  readonly h1: Locator;
  readonly intro: Locator;
  readonly getInTouch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.h1 = page.getByRole('heading', { level: 1, name: WHY_MULTIBANK.h1 });
    this.intro = page
      .getByRole('heading', { level: 2 })
      .filter({ hasText: 'trusted financial institutions' });
    this.getInTouch = page.getByRole('link', { name: WHY_MULTIBANK.strengthSection.ctaText });
  }

  async goto() {
    await this.page.goto(WHY_MULTIBANK_PATH);
    await this.page.waitForLoadState('domcontentloaded');
    await this.h1.waitFor();
  }

  /** A stat tile: the wrapper holding both the value text and its label. */
  statTile(value: string, label: string): Locator {
    return this.page
      .locator('div', { has: this.page.getByText(value, { exact: true }) })
      .filter({ hasText: label })
      .first();
  }

  /** The content <section> that contains the given heading text. */
  sectionContaining(headingText: string): Locator {
    return this.page.locator('section').filter({ hasText: headingText });
  }

  heading(name: string): Locator {
    return this.page.getByRole('heading', { name, exact: true });
  }
}
