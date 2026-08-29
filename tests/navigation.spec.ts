import { test, expect } from '@playwright/test';
import { TopNav } from '../pages/top-nav';
import {
  ALL_NAV_ITEMS,
  DESKTOP_WIDTHS,
  HOME_PATH,
  PRIMARY_NAV,
  UTILITY_NAV,
} from '../data/nav-data';

/**
 * Scenario 1 — Navigation & Layout
 *   • Top navigation renders with all expected items visible
 *   • Each navigation item links to the correct destination
 *   • Navigation behaves correctly at standard desktop viewport sizes
 */
test.describe('Scenario 1: Navigation & Layout', () => {
  let nav: TopNav;

  test.beforeEach(async ({ page }) => {
    nav = new TopNav(page);
    await nav.goto();
  });

  test('top navigation renders with all expected items visible', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`${HOME_PATH}/?$`));

    // Bar and brand.
    await expect(nav.header).toBeVisible();
    await expect(nav.logo).toBeVisible();
    await expect(nav.logo).toHaveAttribute('href', '/');

    // The desktop nav is shown; the mobile toggle is not.
    await expect(nav.primaryNav).toBeVisible();
    await expect(nav.menuToggle).toBeHidden();

    // Every text link is visible, exactly once, with the expected href and target.
    for (const item of ALL_NAV_ITEMS) {
      const link = nav.link(item.label);
      await expect(link, `${item.label} present once`).toHaveCount(1);
      await expect(link, `${item.label} visible`).toBeVisible();
      await expect(link, `${item.label} href`).toHaveAttribute('href', item.href);
      if (item.newTab) {
        await expect(link, `${item.label} opens new tab`).toHaveAttribute('target', '_blank');
      } else {
        expect(await link.getAttribute('target'), `${item.label} same tab`).not.toBe('_blank');
      }
    }

    // Right-hand controls beyond the text links.
    await expect(nav.languageSwitcher, 'language switcher visible').toBeVisible();
    await expect(nav.appDownload, 'app-download control visible').toBeVisible();
  });

  test.describe('each navigation item links to the correct destination', () => {
    for (const item of PRIMARY_NAV) {
      test(`primary: ${item.label} -> ${item.href}`, async ({ page }) => {
        const dest = await nav.open(item.label, item.newTab);
        await expect(dest).toHaveURL(item.expectUrl);
        if (item.newTab) await dest.close();
      });
    }

    for (const item of UTILITY_NAV) {
      test(`utility: ${item.label} -> ${item.href}`, async ({ page }) => {
        const dest = await nav.open(item.label, item.newTab);
        await expect(dest).toHaveURL(item.expectUrl);
        if (item.newTab) await dest.close();
      });
    }

    test('logo returns to the home page', async ({ page }) => {
      await nav.open('Company', false);
      await expect(page).toHaveURL(/mb\.io\/en\/company\/?$/);
      await nav.logo.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(new RegExp(`mb\\.io${HOME_PATH}/?$`));
    });
  });

  test.describe('navigation behaves correctly at standard desktop viewport sizes', () => {
    for (const width of DESKTOP_WIDTHS) {
      test(`layout holds at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.reload({ waitUntil: 'domcontentloaded' });

        await expect(nav.primaryNav).toBeVisible();
        await expect(nav.menuToggle).toBeHidden();

        // All text links visible at this width.
        for (const item of ALL_NAV_ITEMS) {
          await expect(nav.link(item.label), `${item.label} @ ${width}`).toBeVisible();
        }

        // No horizontal overflow of the document.
        const { scrollW, clientW } = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
        }));
        expect(scrollW, 'no horizontal scrollbar').toBeLessThanOrEqual(clientW + 1);

        // Primary nav items sit on a single row (tops within a link's height).
        const boxes = await Promise.all(
          PRIMARY_NAV.map((i) => nav.link(i.label).boundingBox()),
        );
        const tops = boxes.map((b) => b!.y);
        expect(Math.max(...tops) - Math.min(...tops), 'items not wrapped').toBeLessThan(24);

        // Header spans the usable viewport width (clientW excludes any scrollbar,
        // which is present in headed runs but not headless).
        const headerBox = (await nav.header.boundingBox())!;
        expect(headerBox.width, 'header spans the viewport').toBeGreaterThanOrEqual(clientW - 1);
      });
    }
  });
});
