import { test, expect } from '@playwright/test';
import { TopNav } from '../pages/top-nav';
import {
  INVALID_ROUTES,
  KNOWN_GOOD_ROUTE,
  NOT_FOUND,
} from '../data/edge';

/**
 * Scenario 4a — Invalid route handling
 *   • unknown routes return HTTP 404
 *   • the branded "Page not found" page renders, with chrome intact
 *   • the user can recover to the working site
 */
test.describe('Scenario 4: Invalid route handling', () => {
  for (const route of INVALID_ROUTES) {
    test(`"${route}" responds with HTTP ${NOT_FOUND.status}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response, 'navigation produced a response').not.toBeNull();
      expect(response!.status()).toBe(NOT_FOUND.status);
    });
  }

  test('renders the branded not-found page with header and footer intact', async ({ page }) => {
    await page.goto(INVALID_ROUTES[0], { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: NOT_FOUND.heading })).toBeVisible();

    // Site chrome still renders on the error page.
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(new TopNav(page).logo).toBeVisible();

    // A recovery affordance is offered.
    const recovery = page.getByRole('link', { name: NOT_FOUND.recoveryLink.name });
    await expect(recovery).toBeVisible();
    await expect(recovery).toHaveAttribute('href', NOT_FOUND.recoveryLink.href);
  });

  test('"Back to Homepage" recovers from a 404 to the working homepage', async ({ page }) => {
    await page.goto(INVALID_ROUTES[1], { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: NOT_FOUND.recoveryLink.name }).click();

    await expect(page).toHaveURL(/mb\.io\/en\/?$/);
    await expect(page.getByRole('heading', { name: 'Crypto for everyone' })).toBeVisible();
  });

  test('navigation from a 404 page still reaches a real route', async ({ page }) => {
    await page.goto(INVALID_ROUTES[2], { waitUntil: 'domcontentloaded' });

    const nav = new TopNav(page);
    await nav.link('Explore').click();

    await expect(page).toHaveURL(/mb\.io\/en\/explore\/?$/);
    const good = await page.goto(KNOWN_GOOD_ROUTE, { waitUntil: 'domcontentloaded' });
    expect(good!.status()).toBe(200);
  });
});
