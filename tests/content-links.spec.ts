import { test, expect } from '@playwright/test';
import { HomeBanners } from '../pages/home-banners';
import { WhyMultiBankPage } from '../pages/why-multibank';
import {
  APP_SMART_LINK_HOST,
  APP_STORE,
  HERO_BANNER,
  KHABIB_BANNER,
  UA,
  WHY_MULTIBANK,
} from '../data/content';

/**
 * Scenario 3 — Content & Links
 *   • Marketing banners render in the expected page region
 *   • App Store and Google Play download links resolve correctly
 *   • About Us > Why MultiBank renders all expected components,
 *     with correct headings and section text
 */
test.describe('Scenario 3: Content & Links', () => {
  /* -------------------------------------------------------------- *
   *  Marketing banners
   * -------------------------------------------------------------- */
  test.describe('marketing banners render in the expected page region', () => {
    let banners: HomeBanners;

    test.beforeEach(async ({ page }) => {
      banners = new HomeBanners(page);
      await banners.goto();
    });

    test('hero banner renders at the top of the page', async () => {
      await expect(banners.heroHeading).toBeVisible();
      await expect(banners.heroSection).toBeVisible();
      await expect(banners.heroSection).toContainText(HERO_BANNER.bodyIncludes);

      // Hero CTAs + image live inside the hero banner.
      await expect(banners.downloadAppLink).toBeVisible();
      await expect(banners.openAccountLink).toBeVisible();
      await expect(banners.openAccountLink).toHaveAttribute('href', HERO_BANNER.openAccountHref);
      await expect(banners.heroImage).toBeVisible();

      // Region: it is the first section of <main> and sits just below the header.
      expect(await banners.sectionIndex(banners.heroHeading), 'hero is first section').toBe(0);
      expect(await banners.top(banners.heroSection), 'hero near top of page').toBeLessThan(250);
    });

    test('Khabib promotional banner renders as its own mid-page section', async () => {
      await banners.khabibHeading.scrollIntoViewIfNeeded();
      await expect(banners.khabibHeading).toBeVisible();
      await expect(banners.khabibSection).toBeVisible();

      for (const phrase of KHABIB_BANNER.bodyIncludes) {
        await expect(banners.khabibSection).toContainText(phrase);
      }
      await expect(banners.khabibImage).toBeVisible();

      // Region: after the hero, before the footer, and not the first section.
      const heroIdx = await banners.sectionIndex(banners.heroHeading);
      const khabibIdx = await banners.sectionIndex(banners.khabibHeading);
      expect(khabibIdx, 'Khabib banner found in <main>').toBeGreaterThan(heroIdx);

      expect(await banners.top(banners.khabibHeading)).toBeGreaterThan(
        await banners.top(banners.heroSection),
      );
      expect(await banners.top(banners.khabibHeading)).toBeLessThan(
        await banners.top(banners.footer),
      );
    });
  });

  /* -------------------------------------------------------------- *
   *  App Store / Google Play download links
   * -------------------------------------------------------------- */
  test.describe('App Store and Google Play download links resolve correctly', () => {
    let smartLink: string;

    test.beforeEach(async ({ page }) => {
      const banners = new HomeBanners(page);
      await banners.goto();
      await expect(banners.downloadAppLink).toHaveAttribute('target', '_blank');
      smartLink = (await banners.downloadAppLink.getAttribute('href')) ?? '';
      expect(new URL(smartLink).host, 'download CTA points at the smart link').toBe(
        APP_SMART_LINK_HOST,
      );
    });

    test('resolves to the App Store on iOS', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({
        extraHTTPHeaders: { 'user-agent': UA.ios },
      });
      const res = await ctx.get(smartLink, { maxRedirects: 0 });
      expect(res.status(), 'smart link redirects').toBeGreaterThanOrEqual(300);
      expect(res.status()).toBeLessThan(400);
      const location = decodeURIComponent(res.headers()['location'] ?? '');
      expect(location, 'iOS lands on the App Store').toMatch(APP_STORE.ios);
      await ctx.dispose();
    });

    test('resolves to Google Play on Android', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({
        extraHTTPHeaders: { 'user-agent': UA.android },
      });
      const res = await ctx.get(smartLink, { maxRedirects: 0 });
      expect(res.status(), 'smart link redirects').toBeGreaterThanOrEqual(300);
      expect(res.status()).toBeLessThan(400);
      const location = decodeURIComponent(res.headers()['location'] ?? '');
      expect(location, 'Android lands on Google Play').toMatch(APP_STORE.android);
      await ctx.dispose();
    });
  });

  /* -------------------------------------------------------------- *
   *  About Us > Why MultiBank  (/en/company)
   * -------------------------------------------------------------- */
  test.describe('About Us > Why MultiBank renders all expected components', () => {
    let why: WhyMultiBankPage;

    test.beforeEach(async ({ page }) => {
      why = new WhyMultiBankPage(page);
      await why.goto();
    });

    test('page title and hero heading + intro text', async ({ page }) => {
      await expect(page).toHaveTitle(new RegExp(WHY_MULTIBANK.titleIncludes));
      await expect(why.h1).toBeVisible();
      await expect(why.h1).toHaveText(WHY_MULTIBANK.h1);
      await expect(why.intro).toBeVisible();
      await expect(why.intro).toContainText(WHY_MULTIBANK.introIncludes);
    });

    test('hero stat tiles render with value and label', async () => {
      for (const { value, label } of WHY_MULTIBANK.stats) {
        const tile = why.statTile(value, label);
        await expect(tile, `stat "${value}"`).toBeVisible();
        await expect(tile, `stat "${value}" value`).toContainText(value);
        await expect(tile, `stat "${value}" label`).toContainText(label);
      }
    });

    test('the three value-proposition blocks render with heading and body text', async () => {
      for (const prop of WHY_MULTIBANK.valueProps) {
        await expect(why.heading(prop.heading), prop.heading).toBeVisible();
        await expect(
          why.sectionContaining(prop.heading),
          `${prop.heading} body text`,
        ).toContainText(prop.bodyIncludes);
      }
    });

    test('"The strength behind MultiBank Group" section: heading, cards and CTA', async () => {
      const { heading, cards, ctaText, ctaHref } = WHY_MULTIBANK.strengthSection;
      await expect(why.heading(heading)).toBeVisible();

      const section = why.sectionContaining(heading);
      for (const card of cards) {
        await expect(section.getByText(card, { exact: true }), card).toBeVisible();
      }
      await expect(why.getInTouch).toBeVisible();
      await expect(why.getInTouch).toHaveAttribute('href', ctaHref);
      expect(ctaText).toBe('Get in touch');
    });

    test('"Community & Media" section renders with heading and subheading', async () => {
      const { heading, subheading } = WHY_MULTIBANK.communitySection;
      await expect(why.heading(heading)).toBeVisible();
      await expect(why.page.getByText(subheading).first()).toBeVisible();
    });
  });
});
