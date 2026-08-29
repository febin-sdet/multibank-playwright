/**
 * Expected model for Scenario 3 — Content & Links.
 * Derived from live recon of https://mb.io/en and https://mb.io/en/company.
 */

export const HOME_PATH = '/en';
export const WHY_MULTIBANK_PATH = '/en/company';

/* ------------------------------------------------------------------ *
 *  Marketing banners (homepage)
 * ------------------------------------------------------------------ */

export const HERO_BANNER = {
  heading: 'Crypto for everyone',
  bodyIncludes: 'Simple, secure and speedy',
  ctas: {
    downloadApp: 'Download the app',
    openAccount: 'Open an account',
  },
  openAccountHref: 'https://trade.mb.io/register',
  imageAlt: 'Mobile Dashboard',
} as const;

export const KHABIB_BANNER = {
  heading: 'Unblemished. Unstoppable. United.',
  bodyIncludes: [
    'Unbeaten in the ring',
    'Khabib',
    '$MBG Token',
  ],
  // Both banner images carry a copy-pasted alt="Mobile Dashboard"; identify by src.
  imageSrcIncludes: 'khabib',
} as const;

/* ------------------------------------------------------------------ *
 *  App download smart link (AppsFlyer OneLink)
 * ------------------------------------------------------------------ */

export const APP_SMART_LINK_HOST = 'mbio.go.link';

/** UA strings used to exercise the platform-aware redirect. */
export const UA = {
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
} as const;

/** Where the smart link must land per platform (checked against the decoded Location header). */
export const APP_STORE = {
  ios: /apps\.apple\.com\/app\/id1592119946/,
  android: /play\.google\.com\/store\/apps\/details\?id=com\.multibank\.app/,
} as const;

/* ------------------------------------------------------------------ *
 *  About Us > Why MultiBank  (/en/company)
 * ------------------------------------------------------------------ */

export const WHY_MULTIBANK = {
  titleIncludes: 'MultiBank Group',
  h1: 'Why MultiBank Group?',
  introIncludes:
    'MultiBank has built a reputation as one of the world’s most trusted financial institutions',

  stats: [
    { value: '$2 trillion', label: 'Annual turnover' },
    { value: '2,000,000+', label: 'Customers worldwide' },
    { value: '25+', label: 'Offices globally' },
  ],

  valueProps: [
    {
      heading: 'A tradition of global leadership',
      bodyIncludes: 'Founded in 2005, MultiBank has grown into one of the largest financial groups worldwide',
    },
    {
      heading: 'Innovation with purpose',
      bodyIncludes: 'We believe technology should simplify finance',
    },
    {
      heading: 'Integrity built into every decision',
      bodyIncludes: 'Trust is earned through consistent action',
    },
  ],

  strengthSection: {
    heading: 'The strength behind MultiBank Group',
    cards: ['Regulation at our core', 'Proven track record', 'Secure & trusted'],
    ctaText: 'Get in touch',
    ctaHref: '/en/support/contact-us',
  },

  communitySection: {
    heading: 'Community & Media',
    subheading: 'The latest news and discussions about MultiBank Group.',
  },
} as const;
