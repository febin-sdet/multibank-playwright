import { type Locator, type Page } from '@playwright/test';
import { HERO_BANNER, HOME_PATH, KHABIB_BANNER } from '../data/content';

/**
 * Page object for the homepage marketing banners:
 *  - the hero banner ("Crypto for everyone")
 *  - the Khabib / $MBG promotional banner ("Unblemished. Unstoppable. United.")
 *
 * Note: mb.io has no <main>; content sections sit between <header> and <footer>,
 * so <section> alone identifies the content regions.
 */
export class HomeBanners {
  readonly page: Page;
  readonly sections: Locator;
  readonly footer: Locator;

  readonly heroHeading: Locator;
  readonly heroSection: Locator;
  readonly downloadAppLink: Locator;
  readonly openAccountLink: Locator;
  readonly heroImage: Locator;

  readonly khabibHeading: Locator;
  readonly khabibSection: Locator;
  readonly khabibImage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sections = page.locator('section');
    this.footer = page.locator('footer');

    this.heroHeading = page.getByRole('heading', { name: HERO_BANNER.heading, exact: true });
    this.heroSection = this.sections.filter({ has: this.heroHeading });
    this.downloadAppLink = this.heroSection.getByRole('link', { name: HERO_BANNER.ctas.downloadApp });
    this.openAccountLink = this.heroSection.getByRole('link', { name: HERO_BANNER.ctas.openAccount });
    this.heroImage = this.heroSection.getByRole('img', { name: HERO_BANNER.imageAlt }).first();

    this.khabibHeading = page.getByRole('heading', { name: KHABIB_BANNER.heading, exact: true });
    this.khabibSection = this.sections.filter({ has: this.khabibHeading });
    this.khabibImage = this.khabibSection
      .locator(`img[src*="${KHABIB_BANNER.imageSrcIncludes}" i]`)
      .first();
  }

  async goto() {
    await this.page.goto(HOME_PATH);
    await this.page.waitForLoadState('domcontentloaded');
    await this.heroHeading.waitFor();
  }

  /** Top offset of a locator within the page, for region/order assertions. */
  async top(locator: Locator): Promise<number> {
    const box = await locator.boundingBox();
    if (!box) throw new Error('element has no bounding box');
    return box.y;
  }

  /** Index of the content <section> that contains `heading` (0-based, -1 if none). */
  async sectionIndex(heading: Locator): Promise<number> {
    const count = await this.sections.count();
    for (let i = 0; i < count; i++) {
      if (await this.sections.nth(i).filter({ has: heading }).count()) return i;
    }
    return -1;
  }
}
