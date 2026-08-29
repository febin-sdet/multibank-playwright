/**
 * Expected top-navigation model for https://mb.io/.
 * Derived from a live recon run (scripts/recon-nav.ts) + visual verification,
 * not from documentation. Update here if the site's nav changes.
 */

export const SITE_ORIGIN = 'https://mb.io';

/** Home canonicalises to the /en locale. */
export const HOME_PATH = '/en';

export interface NavItem {
  /** Accessible name / visible label. */
  label: string;
  /** Exact value of the anchor's href attribute. */
  href: string;
  /** Opens in a new tab (target="_blank"). */
  newTab: boolean;
  /** True when the destination leaves the mb.io marketing site. */
  external: boolean;
  /** Matches document URL once the destination has loaded. */
  expectUrl: RegExp;
}

/** Items inside the primary <nav> (left/centre of the bar). */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Explore',  href: '/en/explore',           newTab: false, external: false, expectUrl: /mb\.io\/en\/explore\/?$/ },
  { label: 'Features', href: '/en/features',          newTab: false, external: false, expectUrl: /mb\.io\/en\/features\/?$/ },
  { label: 'OTC Desk', href: '/en/features/otc-desk', newTab: false, external: false, expectUrl: /mb\.io\/en\/features\/otc-desk\/?$/ },
  { label: 'Company',  href: '/en/company',           newTab: false, external: false, expectUrl: /mb\.io\/en\/company\/?$/ },
  { label: 'Support',  href: '/en/support',           newTab: false, external: false, expectUrl: /mb\.io\/en\/support\/?$/ },
  { label: 'Blog',     href: '/en/blog',              newTab: false, external: false, expectUrl: /mb\.io\/en\/blog\/?$/ },
  { label: '$MBG',     href: 'https://token.multibankgroup.com/en', newTab: true, external: true, expectUrl: /token\.(mb\.io|multibankgroup\.com)/ },
];

/** Account actions on the right of the bar. */
export const UTILITY_NAV: NavItem[] = [
  { label: 'Sign in', href: 'https://trade.mb.io/login',    newTab: true, external: true, expectUrl: /trade\.mb\.io\/.*login/ },
  { label: 'Sign up', href: 'https://trade.mb.io/register', newTab: true, external: true, expectUrl: /trade\.mb\.io\/.*register/ },
];

/** Every text link in the bar. */
export const ALL_NAV_ITEMS: NavItem[] = [...PRIMARY_NAV, ...UTILITY_NAV];

/** Standard desktop widths scenario 1 must hold at. */
export const DESKTOP_WIDTHS = [1280, 1440, 1920] as const;
