/**
 * Throwaway recon script. Drives a real Chromium to https://mb.io/ and dumps
 * the rendered top-navigation structure so we can build assertions from the
 * actual DOM instead of guesses. Not a test. Run:  npx tsx scripts/recon-nav.ts
 * (or: npx playwright test does NOT pick this up — it lives outside testDir)
 */
import { chromium } from '@playwright/test';

const WIDTHS = [1280, 1440, 1920];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://mb.io/', { waitUntil: 'networkidle' });

  // Try to dismiss a cookie banner if present.
  for (const name of [/accept all/i, /accept/i, /agree/i, /got it/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible().catch(() => false)) {
      console.log(`cookie banner: clicking "${await btn.textContent()}"`);
      await btn.click().catch(() => {});
      break;
    }
  }

  console.log('\n=== FINAL URL ===\n', page.url());
  console.log('\n=== <title> ===\n', await page.title());

  // Dump candidate nav containers.
  const navHtml = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('header, nav, [role="navigation"]'));
    return nodes.map((n) => ({
      tag: n.tagName.toLowerCase(),
      cls: (n as HTMLElement).className,
      id: n.id,
      linkCount: n.querySelectorAll('a').length,
    }));
  });
  console.log('\n=== header / nav containers ===\n', JSON.stringify(navHtml, null, 2));

  // Dump every anchor inside the first header.
  const links = await page.evaluate(() => {
    const header = document.querySelector('header') ?? document.querySelector('nav');
    if (!header) return [];
    return Array.from(header.querySelectorAll('a')).map((a) => ({
      text: (a.textContent || '').trim().replace(/\s+/g, ' '),
      href: a.getAttribute('href'),
      resolved: (a as HTMLAnchorElement).href,
      target: a.getAttribute('target'),
      visible: !!(a.offsetWidth || a.offsetHeight || a.getClientRects().length),
      dataTestId: a.getAttribute('data-testid') || a.getAttribute('data-test') || a.getAttribute('data-cy'),
    }));
  });
  console.log('\n=== header anchors ===\n', JSON.stringify(links, null, 2));

  // Hover each top-level item to reveal dropdowns and capture submenu links.
  const topItems = page.locator('header a, header button');
  const count = await topItems.count();
  console.log(`\n=== hovering ${count} header a/button to reveal submenus ===`);
  for (let i = 0; i < count; i++) {
    const el = topItems.nth(i);
    const label = (await el.textContent().catch(() => ''))?.trim().replace(/\s+/g, ' ');
    if (!label) continue;
    await el.hover().catch(() => {});
    await page.waitForTimeout(400);
    const submenu = await page.evaluate(() => {
      const vis = Array.from(document.querySelectorAll('header a')).filter(
        (a) => !!(a as HTMLElement).offsetParent,
      );
      return vis.map((a) => ({ t: (a.textContent || '').trim().replace(/\s+/g, ' '), h: a.getAttribute('href') }));
    });
    console.log(`  hover "${label}" -> visible header links:`, JSON.stringify(submenu));
  }

  // Viewport behavior.
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => {
      const header = document.querySelector('header')!;
      const anchors = Array.from(header.querySelectorAll('a'));
      const visibleTexts = anchors
        .filter((a) => !!(a as HTMLElement).offsetParent)
        .map((a) => (a.textContent || '').trim().replace(/\s+/g, ' '))
        .filter(Boolean);
      const hamburger = !!header.querySelector(
        '[aria-label*="menu" i], [class*="burger" i], [class*="hamburger" i], button[aria-expanded]',
      );
      return { visibleTexts, hamburger, docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth };
    });
    console.log(`\n=== viewport ${w} ===\n`, JSON.stringify(info, null, 2));
    await page.screenshot({ path: `scripts/recon-${w}.png` });
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
