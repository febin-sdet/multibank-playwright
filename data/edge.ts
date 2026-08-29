/**
 * Expected model for Scenario 4 — Negative / Edge Cases.
 * Derived from live recon (scripts/recon-edge.mjs).
 */

/* ------------------------------------------------------------------ *
 *  Invalid route handling
 * ------------------------------------------------------------------ */

/** Paths that do not exist — locale-prefixed, nested, no-locale, and a bad dynamic segment. */
export const INVALID_ROUTES = [
  '/en/this-page-does-not-exist',
  '/en/company/nope',
  '/totally-bogus',
  '/en/explore/ZZZZZ',
] as const;

export const NOT_FOUND = {
  status: 404,
  heading: 'Page not found',
  recoveryLink: { name: 'Back to Homepage', href: '/en' },
} as const;

/** A route known to be valid, used to prove the site still works after a 404. */
export const KNOWN_GOOD_ROUTE = '/en/explore';

/* ------------------------------------------------------------------ *
 *  Mobile viewport regression
 * ------------------------------------------------------------------ */

/** iPhone SE portrait — the smallest breakpoint we support. */
export const MOBILE_VIEWPORT = { width: 375, height: 667 } as const;

/** Pages that must lay out without horizontal overflow at MOBILE_VIEWPORT. */
export const MOBILE_PAGES = ['/en', '/en/explore', '/en/company'] as const;

export const HERO_HEADING = 'Crypto for everyone';
