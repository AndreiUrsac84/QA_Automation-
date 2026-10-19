import type { APIRequestContext, Page } from '@playwright/test';
import { baseTest as test, expect, toTarget } from './fixtures/site';

/**
 * Crawler pentru linkuri rupte: pornește din Home + sitemap și urmează linkurile interne (max MAX_PAGES pagini).
 * - testul intern rulează în CI (depinde doar de site);
 * - testul extern (@extern) verifică linkurile spre alte site-uri și rulează separat (npm run test:extern),
 *   pentru că depinde de terți (rate limit, anti-bot) și nu trebuie să blocheze pipeline-ul.
 * Folosește fixture-urile fără pauza după goto (baseTest): cu ~270 de pagini (6 limbi), pauza ar dubla durata.
 */
const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES ?? 400);
/** Timeout-ul crawl-ului: ~3s pe pagină, peste timeout-ul implicit al unui test. */
const CRAWL_TIMEOUT = 60_000 + MAX_PAGES * 3_000;
const SKIP_EXTERNAL = [/wa\.me/, /instagram\.com/, /facebook\.com/, /linkedin\.com/]; // blochează boții

/**
 * Pornește din Home și din toate URL-urile din sitemap: traducerile și subiectele se leagă doar din meniurile
 * derulante (randate abia la click), deci doar din Home crawl-ul ar ajunge la ~50 din ~270 de pagini.
 */
async function startUrls(request: APIRequestContext, origin: string): Promise<string[]> {
  const res = await request.get('/sitemap.xml');
  const fromSitemap = res.ok()
    ? [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(toTarget(m[1].trim())).pathname)
    : [];
  return [...new Set(['/', ...fromSitemap])].map((path) => origin + path);
}

async function crawl(page: Page, request: APIRequestContext, origin: string) {
  const queue: string[] = await startUrls(request, origin);
  const visited = new Set<string>();
  const external = new Map<string, string>(); // url -> pagina sursă
  const broken: string[] = [];

  while (queue.length && visited.size < MAX_PAGES) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const res = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
    if (!res || res.status() >= 400) {
      broken.push(`${res?.status() ?? 'ERR'} ${url}`);
      continue;
    }

    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const raw of hrefs) {
      if (!/^https?:/.test(raw)) continue; // mailto:, tel:, javascript:
      const u = new URL(toTarget(raw)); // pe ținta locală, adresele absolute de producție sunt pagini interne
      u.hash = '';
      const clean = u.toString();
      if (u.origin === origin) {
        if (!visited.has(clean) && !queue.includes(clean) && !/\.(pdf|jpe?g|png|webp|zip|dwg)$/i.test(u.pathname)) {
          queue.push(clean);
        }
      } else if (!external.has(clean)) {
        external.set(clean, url);
      }
    }
  }
  test.info().annotations.push({ type: 'pagini crawl-uite', description: String(visited.size) });
  if (queue.some((u) => !visited.has(u))) {
    // limita a oprit crawl-ul: o parte din site n-a fost verificată (nu e eroare, dar trebuie să se vadă în raport)
    test.info().annotations.push({ type: 'atenție', description: `crawl oprit la CRAWL_MAX_PAGES=${MAX_PAGES}, pagini rămase neverificate` });
  }
  return { broken, external };
}

test('nu există linkuri interne rupte (crawl)', async ({ page, request, baseURL }) => {
  test.setTimeout(CRAWL_TIMEOUT);
  test.skip(test.info().project.name !== 'desktop-chrome', 'crawl o singură dată');

  const { broken } = await crawl(page, request, new URL(baseURL!).origin);
  expect(broken, 'linkuri interne rupte').toEqual([]);
});

test('nu există linkuri externe rupte @extern', async ({ page, request, baseURL }) => {
  test.setTimeout(CRAWL_TIMEOUT + 300_000); // + verificarea linkurilor externe
  test.skip(test.info().project.name !== 'desktop-chrome', 'crawl o singură dată');

  const { external } = await crawl(page, request, new URL(baseURL!).origin);
  const broken: string[] = [];
  for (const [ext, from] of external) {
    if (SKIP_EXTERNAL.some((re) => re.test(ext))) continue;
    const r = await request.get(ext, { timeout: 15_000, failOnStatusCode: false }).catch(() => null);
    if (!r || r.status() >= 400) broken.push(`${r?.status() ?? 'ERR'} ${ext} (din ${from})`);
  }
  test.info().annotations.push({ type: 'linkuri externe', description: String(external.size) });
  expect(broken, 'linkuri externe rupte').toEqual([]);
});
