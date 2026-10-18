import type { APIRequestContext } from '@playwright/test';
import { test, expect, PAGES, ARTICLES } from './fixtures/site';

/**
 * Search: cum văd motoarele de căutare (Google) paginile principale și articolele – indexabile, în sitemap,
 * canonical corect, date structurate (JSON-LD) valide, titluri/descrieri unice, robots.txt fără blocări.
 * Site-ul nu are căutare internă; „search” = vizibilitate în căutare. Verificările on-page sunt în seo.spec.ts.
 * Conținutul HTML e același în orice browser, deci testele rulează o singură dată (desktop-chrome).
 */
const ALL = [
  ...PAGES.map((p) => ({ path: p.path, articol: false })),
  ...ARTICLES.map((a) => ({ path: a.path, articol: true })),
];
const norm = (p: string) => p.replace(/\/?$/, '/');
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

let sitemapCache: Promise<{ path: string; lastmod?: string }[]> | undefined;
/** Intrările din sitemap.xml (calea + lastmod), citite o dată per worker. */
function sitemapEntries(request: APIRequestContext) {
  sitemapCache ??= request.get('/sitemap.xml').then(async (res) => {
    expect(res.status(), 'sitemap.xml').toBe(200);
    return [...(await res.text()).matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, url]) => ({
      path: norm(new URL(url.match(/<loc>([^<]+)<\/loc>/)![1].trim()).pathname),
      lastmod: url.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1].trim(),
    }));
  });
  return sitemapCache;
}

type JsonLd = Record<string, unknown>;
/** Toate obiectele JSON-LD din pagină (inclusiv cele din @graph); un bloc invalid apare ca eroare. */
function flattenJsonLd(blocks: string[]): { items: JsonLd[]; errors: string[] } {
  const items: JsonLd[] = [];
  const errors: string[] = [];
  for (const [i, raw] of blocks.entries()) {
    try {
      const data = JSON.parse(raw);
      for (const d of Array.isArray(data) ? data : [data]) items.push(...(Array.isArray(d['@graph']) ? d['@graph'] : [d]));
    } catch (e) {
      errors.push(`JSON-LD #${i + 1} invalid: ${(e as Error).message}`);
    }
  }
  return { items, errors };
}
const hasType = (item: JsonLd, re: RegExp) => [item['@type']].flat().some((t) => re.test(String(t)));

test.describe('Search – indexare în motoarele de căutare', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop-chrome', 'același HTML în orice browser: rulează o singură dată');
  });

  test('sitemap-ul conține articole și fiecare URL are lastmod valid', async ({ request }) => {
    expect(ARTICLES.length, 'niciun articol citit din sitemap (vezi ARTICLES în fixtures/site.ts)').toBeGreaterThan(0);
    const entries = await sitemapEntries(request);
    const bad = entries.filter((e) => !e.lastmod || !ISO_DATE.test(e.lastmod) || Number.isNaN(Date.parse(e.lastmod)));
    expect(bad.map((e) => `${e.path} (lastmod: ${e.lastmod ?? 'lipsă'})`), 'URL-uri fără lastmod valid').toEqual([]);
    const viitor = entries.filter((e) => e.lastmod && Date.parse(e.lastmod) > Date.now() + 24 * 3600_000);
    expect(viitor.map((e) => `${e.path} (${e.lastmod})`), 'lastmod în viitor').toEqual([]);
  });

  for (const p of ALL) {
    test(`${p.articol ? 'articol' : 'pagina'} ${p.path} e indexabilă`, async ({ page, request }) => {
      const res = await page.goto(p.path);
      expect(res?.status(), `status ${p.path}`).toBe(200);
      expect.soft(res?.headers()['x-robots-tag'] ?? '', 'header X-Robots-Tag').not.toMatch(/noindex|none/i);

      const robots = page.locator('meta[name="robots"]');
      if ((await robots.count()) > 0) {
        expect.soft(await robots.getAttribute('content'), 'meta robots').not.toMatch(/noindex|none/i);
      }

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical, 'exact un <link rel="canonical">').toHaveCount(1);
      const href = (await canonical.getAttribute('href')) ?? '';
      expect.soft(href, 'canonical absolut, pe HTTPS').toMatch(/^https:\/\//);
      expect.soft(norm(new URL(href, page.url()).pathname), 'canonical indică pagina însăși').toBe(norm(p.path));

      const inSitemap = (await sitemapEntries(request)).some((e) => e.path === norm(p.path));
      expect.soft(inSitemap, `${p.path} în sitemap.xml`).toBe(true);

      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      const { items, errors } = flattenJsonLd(blocks);
      expect.soft(errors, 'JSON-LD valid').toEqual([]);
      const org = items.find((i) => hasType(i, /Organization|ProfessionalService|LocalBusiness/));
      expect.soft(org?.name, 'schema organizației (ProfessionalService) cu numele firmei').toMatch(/DAURON TRUST/);

      if (p.articol) {
        const article = items.find((i) => hasType(i, /Article|BlogPosting/));
        expect(article, 'schema Article pe articol').toBeTruthy();
        expect.soft(String(article!.headline ?? ''), 'Article.headline').not.toBe('');
        expect.soft(String(article!.datePublished ?? ''), 'Article.datePublished (ISO)').toMatch(ISO_DATE);
        const published = Date.parse(String(article!.datePublished));
        const modified = Date.parse(String(article!.dateModified ?? article!.datePublished));
        expect.soft(modified >= published, 'Article.dateModified ≥ datePublished').toBe(true);
      }
    });
  }

  test('titlurile și descrierile sunt unice pe tot site-ul', async ({ request }) => {
    test.slow();
    const titles = new Map<string, string[]>();
    const descs = new Map<string, string[]>();
    for (const p of ALL) {
      const html = await (await request.get(p.path)).text();
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1].trim() ?? '';
      const desc = html.match(/<meta name="description" content="([^"]*)"/i)?.[1].trim() ?? '';
      titles.set(title, [...(titles.get(title) ?? []), p.path]);
      descs.set(desc, [...(descs.get(desc) ?? []), p.path]);
    }
    const dup = (m: Map<string, string[]>) => [...m].filter(([, paths]) => paths.length > 1).map(([v, paths]) => `„${v}”: ${paths.join(', ')}`);
    expect.soft(dup(titles), 'title duplicat').toEqual([]);
    expect.soft(dup(descs), 'meta description duplicată').toEqual([]);
  });

  test('robots.txt nu blochează nicio pagină din sitemap', async ({ request }) => {
    const txt = await (await request.get('/robots.txt')).text();
    // regulile din grupurile pentru toți roboții (User-agent: *) și pentru Googlebot
    const disallow: string[] = [];
    let applies = false;
    for (const line of txt.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim())) {
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      if (/^user-agent$/i.test(key)) applies = value === '*' || /googlebot/i.test(value);
      else if (applies && /^disallow$/i.test(key) && value) disallow.push(value);
    }
    const blocked = (await sitemapEntries(request))
      .filter((e) => disallow.some((rule) => e.path.startsWith(rule.replace(/\*.*$/, ''))))
      .map((e) => e.path);
    expect(blocked, `pagini din sitemap blocate de robots.txt (Disallow: ${disallow.join(', ') || '–'})`).toEqual([]);
  });
});
