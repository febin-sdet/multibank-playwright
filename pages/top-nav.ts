import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for the mb.io top navigation bar.
 * Scopes every locator to <header> so footer links never collide.
 */
export class TopNav {
  readonly page: Page;
  readonly header: Locator;
  readonly primaryNav: Locator;
  readonly logo: Locator;
  readonly menuToggle: Locator;
  readonly languageSwitcher: Locator;
  readonly appDownload: Locator;
  /** The mobile slide-out menu (Radix sheet, portalled outside <header>). */
  readonly mobileMenu: Locator;
  readonly mobileMenuClose: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header').first();
    // The primary <nav> exposes an accessible name of "Main".
    this.primaryNav = this.header.getByRole('navigation', { name: 'Main' });
    this.logo = this.header.getByRole('link', { name: 'Home' });
    this.menuToggle = this.header.getByRole('button', { name: /open menu/i });
    // Globe (language) and app-download are Radix popover triggers rendered as <div>s;
    // first is the language switcher, second is the app-download popover.
    this.languageSwitcher = this.header.locator('[data-slot="popover-trigger"]').first();
    this.appDownload = this.header.locator('[data-slot="popover-trigger"]').nth(1);
    this.mobileMenu = page.locator('[data-slot="sheet-content"]');
    this.mobileMenuClose = this.page.getByRole('button', { name: /close menu/i });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.dismissConsentIfPresent();
  }

  /** mb.io showed no consent banner in recon, but guard against a regional one. */
  async dismissConsentIfPresent() {
    for (const name of [/accept all/i, /accept/i, /agree/i, /got it/i]) {
      const btn = this.page.getByRole('button', { name }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {});
        break;
      }
    }
  }

  /** A text link in the bar, by its visible label. */
  link(label: string): Locator {
    return this.header.getByRole('link', { name: label, exact: true });
  }

  /** A text link inside the open mobile menu, by its visible label. */
  mobileMenuLink(label: string): Locator {
    return this.mobileMenu.getByRole('link', { name: label, exact: true });
  }

  async openMobileMenu() {
    await this.menuToggle.click();
    await expect(this.mobileMenu).toBeVisible();
  }

  async closeMobileMenu() {
    await this.mobileMenuClose.click();
    await expect(this.mobileMenu).toBeHidden();
  }

  /**
   * Activate a nav item and resolve where it lands.
   * Same-tab links: navigates the current page. New-tab links: returns the popup.
   */
  async open(label: string, newTab: boolean): Promise<Page> {
    const target = this.link(label);
    await expect(target).toBeVisible();
    if (newTab) {
      const popupPromise = this.page.context().waitForEvent('page');
      await target.click();
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      return popup;
    }
    await target.click();
    await this.page.waitForLoadState('domcontentloaded');
    return this.page;
  }
}
