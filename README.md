# mb.io UI automation

End-to-end tests for the public marketing site <https://mb.io/>, built with
[Playwright](https://playwright.dev/) + TypeScript.

## Layout

| Path | Purpose |
|---|---|
| `playwright.config.ts` | `baseURL` = `https://mb.io/` (override with `BASE_URL`); Chromium project only for now |
| `tests/*.spec.ts` | Specs only — one per scenario |
| `pages/` | Page objects |
| `data/` | Expected-data models the assertions check against (e.g. the nav model) |
| `scripts/` | Throwaway recon scripts used to derive selectors/expected data from the live site |

Shared helper functions get a `utils/` folder when the first one actually
appears — until then, per-page logic lives in the page object.

## Run

```bash
npm ci
npx playwright install chromium
npm test                 # all specs, headless
npm run test:headed      # watch it drive a browser
npm run test:ui          # Playwright UI mode
npm run report           # open the last HTML report
```

Single scenario: `npx playwright test navigation`.

## Scenarios

### 1. Navigation & Layout — `tests/navigation.spec.ts`

- **renders with all expected items visible** — header, logo, the primary `nav`
  (`Explore, Features, OTC Desk, Company, Support, Blog, $MBG`), the utility links
  (`Sign in`, `Sign up`), language + app-download controls; the mobile hamburger
  is hidden. Each link is asserted present once, visible, with the exact `href`
  and correct `target`.
- **each item links to the correct destination** — every link is activated:
  internal links navigate the page, new-tab links (`$MBG`, `Sign in`, `Sign up`)
  are followed into their popup, and the resulting URL is asserted. The logo is
  verified to return home from an inner page.
- **behaves correctly at standard desktop viewport sizes** — 1280 / 1440 / 1920:
  primary nav visible, hamburger hidden, all links visible, no horizontal
  document overflow, primary items on a single row, header spans the viewport.

Expected nav data lives in `data/nav-data.ts` — update it there when the
site's navigation changes.

### 2. Trading Functionality — `tests/trading.spec.ts`

Targets the **"Spot market"** section on `/en/explore` (page object `pages/spot-market.ts`,
data `data/spot-market.ts`).

- **section renders and displays trading pairs** — the section, its headings and
  description render; the pair table is populated (≥ 5 rows); rows across all
  categories resolve to valid ticker symbols including BTC and ETH.
- **pairs are correctly grouped into categories** — the `Hot` / `Gainers` /
  `Losers` tabs exist, each selects exclusively (active-tab class), and each
  yields a non-empty, duplicate-free pair list; the three categories are not the
  same list and `Losers` surfaces pairs `Hot` does not.
- **entries contain the expected data fields** — for the top rows: ticker symbol,
  coin name, icon (`src` + `alt`), detail link (`/explore/<SYMBOL>`), fiat price,
  24h change %, and a 7-day sparkline.

> The public site is served **dev/mock** market data (`static.mb-dev.io`): prices,
> row counts and per-row up/down direction are not stable, and every row currently
> renders in the "down" colour. Category grouping is therefore verified by content
> (distinct pair sets per tab), not by the sign of the % change.

### 3. Content & Links — `tests/content-links.spec.ts`

- **marketing banners render in the expected page region** — homepage hero banner
  ("Crypto for everyone") is the **first** `<section>` and sits at the top, with its
  Download / Open-account CTAs and mockup image; the **Khabib / $MBG** banner
  ("Unblemished. Unstoppable. United.") renders as its own `<section>` positioned
  after the hero and above the footer, with its copy and image.
  (page object `pages/home-banners.ts`)
- **App Store and Google Play download links resolve correctly** — the single
  "Download the app" smart link (`mbio.go.link`, `target=_blank`) is followed with
  `maxRedirects: 0` under an iOS UA → `apps.apple.com/app/id1592119946`, and under an
  Android UA → `play.google.com/store/apps/details?id=com.multibank.app`.
- **About Us > Why MultiBank renders all expected components** — `/en/company`
  (page object `pages/why-multibank.ts`): page `<title>`, `<h1>` "Why MultiBank
  Group?", intro `<h2>`, the 3 hero stat tiles (value + label), the 3
  value-proposition blocks (heading + body text), "The strength behind MultiBank
  Group" (heading + 3 cards + "Get in touch" → `/en/support/contact-us`), and
  "Community & Media" (heading + subheading).

> mb.io renders **no `<main>` element** — content `<section>`s sit directly between
> `<header>` and `<footer>`, so `page.locator('section')` identifies the content
> regions. Both homepage banner images carry a copy-pasted `alt="Mobile Dashboard"`,
> so the Khabib image is matched by `src`.

### 4. Negative / Edge Cases

**Invalid route handling** — `tests/invalid-route.spec.ts`

- Unknown paths (locale-prefixed, nested, no-locale, bad dynamic segment) all respond
  **HTTP 404**.
- The branded `Page not found` page renders with header + footer + logo intact and a
  `Back to Homepage` → `/en` recovery link.
- Recovery works: "Back to Homepage" lands on the working homepage; the top nav on a
  404 page still navigates to a real route.

**Mobile viewport regression (375×667)** — `tests/mobile-viewport.spec.ts`

- Layout collapses to mobile nav: the hamburger shows, the desktop `nav[aria-label="Main"]`
  is hidden, the hero still renders.
- No horizontal overflow on `/en`, `/en/explore`, `/en/company`.
- The mobile menu (Radix sheet, `[data-slot="sheet-content"]`) exposes every nav item
  with the correct `href`; a menu link navigates and the sheet closes.

Expected data: `data/edge.ts`. Reuses `pages/top-nav.ts` (extended with `mobileMenu`
helpers) and `data/nav-data.ts`.
