import { chromium } from '@playwright/test';

const URLS = [
  'https://mb.io/en/explore',
  'https://mb.io/en',
  'https://mb.io/en/markets',
  'https://mb.io/en/prices',
];

async function scan(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
  console.log(`\n\n######## ${url}  ->  ${resp ? resp.status() : 'ERR'}  ${page.url()}`);
  if (!resp || resp.status() >= 400) { await browser.close(); return; }
  await page.waitForTimeout(2500);
  for (let y = 0; y < 14; y++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(350); }
  await page.waitForTimeout(1500);

  const data = await page.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const mentions = [];
    document.querySelectorAll('h1,h2,h3,h4').forEach((el) => {
      const t = norm(el.textContent);
      if (t && t.length < 90) mentions.push(el.tagName.toLowerCase() + ': ' + t);
    });
    const tables = Array.from(document.querySelectorAll('table')).map((tb) => ({
      headers: Array.from(tb.querySelectorAll('thead th, thead td')).map((h) => norm(h.textContent)),
      rowCount: tb.querySelectorAll('tbody tr').length,
      firstRows: Array.from(tb.querySelectorAll('tbody tr')).slice(0, 3).map((r) =>
        Array.from(r.querySelectorAll('td,th')).map((c) => norm(c.textContent))),
    }));
    const tablists = Array.from(document.querySelectorAll('[role="tablist"]')).map((tl) => ({
      tabs: Array.from(tl.querySelectorAll('[role="tab"]')).map((t) => norm(t.textContent)),
    }));
    // generic tab-ish groups
    const tabish = [];
    document.querySelectorAll('div,ul,nav').forEach((c) => {
      const kids = Array.from(c.children);
      if (kids.length >= 2 && kids.length <= 8) {
        const labels = kids.map((k) => norm(k.textContent)).filter((x) => x && x.length < 16);
        if (labels.length === kids.length && /hot|gainer|loser|new|favou?rite|all|trending|top|volume/i.test(labels.join(' '))) {
          tabish.push(labels.join(' | '));
        }
      }
    });
    // price rows
    const rows = [];
    const seen = new Set();
    document.querySelectorAll('a,li,tr,div').forEach((el) => {
      const t = norm(el.textContent);
      if (t.length < 4 || t.length > 120) return;
      if (!/[\d,]+\.\d/.test(t) || !/%/.test(t)) return;
      const p = el.parentElement; if (!p) return;
      const key = (p.className || '') + '|' + p.tagName;
      if (seen.has(key)) return; seen.add(key);
      const sib = Array.from(p.children).filter((c) => /%/.test(norm(c.textContent)) && /[\d,]+\.\d/.test(norm(c.textContent)));
      if (sib.length >= 3) rows.push({ count: sib.length, sample: t, cls: (el.className || '').toString().slice(0, 70) });
    });
    return { mentions: [...new Set(mentions)], tables, tablists, tabish: [...new Set(tabish)], rows: rows.slice(0, 8) };
  });
  console.log(JSON.stringify(data, null, 2));
  const slug = url.split('/').filter(Boolean).pop();
  await page.screenshot({ path: `scripts/recon-trading-${slug}.png`, fullPage: true }).catch(() => {});
  await browser.close();
}
for (const u of URLS) await scan(u);
