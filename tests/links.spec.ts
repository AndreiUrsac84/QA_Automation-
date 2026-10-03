import { test, expect } from './fixtures/site';

/**
 * Crawler pentru linkuri rupte: pornește din Home, urmează linkurile interne
 * (max MAX_PAGES pagini) și verifică și resursele externe (HEAD/GET).
 */
const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES ?? 60);
const SKIP_EXTERNAL = [/wa\.me/, /instagram\.com/, /facebook\.com/, /linkedin\.com/]; // blochează boții

test('nu există linkuri rupte (crawl intern + externe)', async ({ page, request, baseURL }) => {
  test.slow();
  test.skip(test.info().project.name !== 'desktop-chrome', 'crawl o singură dată');

  const origin = new URL(baseURL!).origin;
  const queue: string[] = [origin + '/'];
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
      const u = new URL(raw);
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

  for (const [ext, from] of external) {
    if (SKIP_EXTERNAL.some((re) => re.test(ext))) continue;
    const r = await request.get(ext, { timeout: 15_000, failOnStatusCode: false }).catch(() => null);
    if (!r || r.status() >= 400) broken.push(`${r?.status() ?? 'ERR'} ${ext} (din ${from})`);
  }

  test.info().annotations.push({ type: 'pagini crawl-uite', description: String(visited.size) });
  test.info().annotations.push({ type: 'linkuri externe', description: String(external.size) });
  expect(broken, 'linkuri rupte').toEqual([]);
});
