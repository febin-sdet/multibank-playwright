import { test, expect } from '@playwright/test';
import { TopNav } from '../pages/top-nav';
import { HERO_HEADING, MOBILE_PAGES, MOBILE_VIEWPORT } from '../data/edge';
import { PRIMARY_NAV, UTILITY_NAV } from '../data/nav-data';

/**
 * Scenario 4b — Viewport regression at a mobile breakpoint (375x667)
 *   • the layout switches to the mobile navigation (hamburger, no desktop nav)
 *   • no horizontal overflow on key pages
 *   • the mobile menu exposes every navigation item and can navigate
 */
test.use({ viewport: MOBILE_VIEWPORT, isMobile: true, hasTouch: true });

test.describe('Scenario 4: Mobile viewport regression', () => {
  let nav: TopNav;

  test.beforeEach(async ({ page }) => {
    nav = new TopNav(page);
    await nav.goto();
  });

  test('collapses to the mobile navigation', async ({ page }) => {
    await expect(nav.menuToggle, 'hamburger shown').toBeVisible();
    await expect(nav.primaryNav, 'desktop nav hidden').toBeHidden();
    await expect(page.getByRole('heading', { name: HERO_HEADING }), 'hero still renders').toBeVisible();
  });

  for (const path of MOBILE_PAGES) {
    test(`"${path}" has no horizontal overflow at ${MOBILE_VIEWPORT.width}px`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const { scrollW, clientW } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(scrollW, 'document does not scroll horizontally').toBeLessThanOrEqual(clientW + 1);
    });
  }

  test('the mobile menu exposes every navigation item', async () => {
    await nav.openMobileMenu();

    for (const item of [...PRIMARY_NAV, ...UTILITY_NAV]) {
      const link = nav.mobileMenuLink(item.label);
      await expect(link, `${item.label} in mobile menu`).toBeVisible();
      await expect(link, `${item.label} href`).toHaveAttribute('href', item.href);
    }

    await nav.closeMobileMenu();
  });

  test('a mobile menu link navigates and closes the menu', async ({ page }) => {
    await nav.openMobileMenu();
    await nav.mobileMenuLink('Explore').click();

    await expect(page).toHaveURL(/mb\.io\/en\/explore\/?$/);
    await expect(nav.mobileMenu).toBeHidden();
  });
});
