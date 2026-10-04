import { test, expect, PAGES } from './fixtures/site';
import { ArticolePage } from '../Pages';

test.describe('SEO tehnic', () => {
  for (const p of PAGES) {
    test(`meta tags pe ${p.path}`, async ({ page }) => {
      await page.goto(p.path);

      const title = await page.title();
      expect(title.length, 'title între 10 și 70 caractere').toBeGreaterThanOrEqual(10);
      expect(title.length).toBeLessThanOrEqual(70);

      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc, 'meta description lipsă').toBeTruthy();
      expect(desc!.length, 'meta description 50–170 caractere').toBeGreaterThanOrEqual(50);
      expect(desc!.length).toBeLessThanOrEqual(170);

      await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\//);

      expect(await page.locator('h1').count(), 'exact un H1 pe pagină').toBe(1);

      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      if (robots) expect(robots).not.toMatch(/noindex/i);
    });

    test(`canonical + lang pe ${p.path}`, async ({ page }) => {
      await page.goto(p.path);
      const lang = await page.locator('html').getAttribute('lang');
      expect.soft(lang, '<html lang> ar trebui să fie "ro"').toMatch(/^ro/i);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href').catch(() => null);
      expect.soft(canonical, 'lipsește <link rel="canonical">').toBeTruthy();
      if (canonical) expect.soft(new URL(canonical).pathname).toBe(new URL(page.url()).pathname);
    });
  }

  test('og:url corespunde paginii curente', async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.path);
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
      if (!ogUrl) continue;
      expect.soft(new URL(ogUrl).pathname, `og:url pe ${p.path}`).toBe(new URL(page.url()).pathname);
    }
  });

  test('robots.txt și sitemap.xml sunt accesibile @smoke', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const robotsTxt = await robots.text();
    expect(robotsTxt).not.toMatch(/Disallow:\s*\/\s*$/m);

    const sitemapUrl = robotsTxt.match(/Sitemap:\s*(\S+)/i)?.[1] ?? '/sitemap.xml';
    const sitemap = await request.get(sitemapUrl);
    expect(sitemap.status(), `sitemap la ${sitemapUrl}`).toBe(200);
    expect(await sitemap.text()).toMatch(/<urlset|<sitemapindex/);
  });

  test('acoperire: paginile din sitemap sunt în PAGES, iar articolele din sitemap apar în listă', async ({ page, request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status(), 'sitemap.xml').toBe(200);
    const paths = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].trim()).pathname);
    const isArticle = (p: string) => /^\/articole\/[^/]+\/?$/.test(p);
    const norm = (p: string) => p.replace(/\/?$/, '/');

    const known = new Set(PAGES.map((p) => norm(p.path)));
    const missing = paths.filter((p) => !isArticle(p) && !known.has(norm(p)));
    expect(missing, 'pagini din sitemap care lipsesc din PAGES (tests/fixtures/site.ts)').toEqual([]);
    const inSitemap = new Set(paths.map(norm));
    const notInSitemap = PAGES.filter((p) => !inSitemap.has(norm(p.path))).map((p) => p.path);
    expect(notInSitemap, 'pagini din PAGES care lipsesc din sitemap').toEqual([]);

    const articole = new ArticolePage(page);
    await articole.open();
    const listed = new Set((await articole.articleUrls()).map((u) => norm(new URL(u).pathname)));
    const unlisted = paths.filter(isArticle).filter((p) => !listed.has(norm(p)));
    expect(unlisted, 'articole din sitemap care nu apar în lista /articole/').toEqual([]);
  });

  test('toate URL-urile din sitemap răspund 200', async ({ request }) => {
    test.slow();
    const res = await request.get('/sitemap.xml');
    test.skip(!res.ok(), 'sitemap.xml lipsește');
    const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    const failed: string[] = [];
    for (const u of urls) {
      const r = await request.get(u, { maxRedirects: 0 });
      if (r.status() !== 200) failed.push(`${r.status()} ${u}`);
    }
    expect(failed, 'URL-uri din sitemap care nu dau 200 direct').toEqual([]);
  });
});
