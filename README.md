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

---

# Task 2 — QA Strategy & Thinking

**Scenario:** first QA hire at a fintech startup. A mobile trading app (iOS + Android)
is two weeks from its first public release. No existing test suite, no QA docs, the
dev team has been shipping fast, and real user funds are involved.

## 1. Where do you start?

I wouldn't start by writing tests. First I'd figure out how the app makes and moves
money — signing up, depositing, placing a trade, withdrawing, and where the balance is
shown. Those are the parts that matter. I'd talk to the founders and devs to understand
what they're most worried about and what (if anything) is already tested. I'd get
access to a test environment, test accounts, and the crash/error logs. Then I'd just
use the app on both iOS and Android like a real user and write down every bug and
question. By the end of week one I'd have a ranked list of risks and an honest opinion
on whether two weeks is realistic or the scope needs trimming.

## 2. How would you approach testing it?

Focus on the highest-risk stuff first: anything where a user could lose money or get
locked out. I'd rank features into "must be perfect" (login, deposits, withdrawals,
placing orders, balance accuracy, fees) and "less critical" (settings, styling).

Most of the real logic is on the backend, so I'd test the money-related APIs directly —
checking things like: does it handle a double-tap on "Buy" without placing two orders,
does it reject bad input, does the balance always match. On the app itself I'd do
hands-on exploratory testing plus run the main flows on a few real devices. I'd also
check security basics (how login tokens are stored, session timeout), what happens when
the network drops mid-trade, and app updates for someone already logged in. Only a tiny
bit of automation early — a quick smoke check that runs on every build.

## 3. What does QA look like in a sprint?

QA is involved from the start, not just at the end.

- **Ticket stage:** I help write clear acceptance criteria and ask "how could this
  break, how do we undo it if it goes wrong."
- **Before coding:** quick chat with the dev and PM to agree on edge cases and what
  data/environment we'll need.
- **While it's being built:** I write my test notes and prep test data.
- **When it's ready:** the dev gives me a build, I test against the acceptance
  criteria, poke around the edges, and check it didn't break anything nearby.
- **Bugs:** severity is based on money/security impact, not looks. Fixed within the
  sprint if it's serious.
- **Done means:** works on both platforms, no serious bugs open, smoke test updated,
  and there's a way to turn the feature off if needed.
- **Regression:** a bit every merge (automated smoke), and a focused manual pass on the
  release build covering what changed plus the critical money flows — not re-testing
  everything.

## 4. What does your ideal regression suite look like?

Layered, and fast where it counts:

- **Lots of small unit tests** on the money math (rounding, fees, currency) — cheap and
  catch the scariest bugs.
- **API tests** for the key journeys: fund, trade, cancel, withdraw, check balance.
  Stable and quick — this is the core of regression.
- **A small set of UI tests** on real devices for the handful of flows a user can't
  live without (login, view portfolio, place/cancel order, withdrawal).
- Plus checks for security and for the balance always reconciling.

Rules: tests must be reliable (no random failures — flaky tests get fixed or deleted),
run automatically, and every bug that reaches production becomes a new test so it can't
come back.

## 5. What would keep you up at night?

- **Money being quietly wrong** — a rounding bug or a balance that looks right but
  isn't. Users won't notice for days and won't forgive it.
- **Duplicate transactions** — bad signal plus a retry placing two orders, or the app
  dying mid-trade.
- **Account takeover** — weak login, token storage, or an account-recovery flow someone
  could trick their way through.
- **No emergency brake** — can we actually stop trading or withdrawals and roll back if
  something goes wrong on launch night? Will we find out from an alert or from angry
  users online?
- **The timeline** — no tests, a fast-moving team, one QA person. There's a lot we
  won't have checked.
- **Compliance** — KYC, which countries it's allowed in, record-keeping. Getting that
  wrong can sink a startup.
- **App Store review** — finance apps get extra scrutiny; a rejection at day 13 blows
  the date.
