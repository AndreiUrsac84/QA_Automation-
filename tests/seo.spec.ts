import { test, expect, PAGES, ARTICLES, LANGUAGES, splitLanguage } from './fixtures/site';
import { ArticolePage } from '../Pages';

/** Paginile principale + toate articolele din sitemap: verificările SEO on-page rulează pe fiecare. */
const SEO_PAGES = [...PAGES.map((p) => p.path), ...ARTICLES.map((a) => a.path)].map((path) => ({ path }));

test.describe('SEO tehnic', () => {
  for (const p of SEO_PAGES) {
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

      const noAlt = await page.locator('img:not([alt])').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).src));
      expect.soft(noAlt, 'imagini fără atribut alt').toEqual([]);

      // meta robots e opțional (lipsă = index, follow): getAttribute() pe un meta inexistent ar aștepta tot timeout-ul
      const robotsMeta = page.locator('meta[name="robots"]');
      if ((await robotsMeta.count()) > 0) expect(await robotsMeta.getAttribute('content')).not.toMatch(/noindex/i);
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
    test.slow();
    for (const p of SEO_PAGES) {
      await page.goto(p.path);
      // og:url e opțional: getAttribute() pe un meta inexistent ar aștepta tot timeout-ul, deci verificăm întâi dacă există
      const ogMeta = page.locator('meta[property="og:url"]');
      if ((await ogMeta.count()) === 0) continue;
      const ogUrl = await ogMeta.getAttribute('content');
      if (!ogUrl) continue;
      expect.soft(new URL(ogUrl).pathname, `og:url pe ${p.path}`).toBe(new URL(page.url()).pathname);
    }
  });

  // În release-ul din 2026-10 /about/ și /portfolio/ au devenit /despre-noi/ și /portofoliu/; adresele vechi trebuie
  // să rămână redirecționate 301, ca linkurile externe și indexarea Google să nu se piardă.
  test('adresele vechi redirecționează 301 către cele noi @smoke', async ({ request }) => {
    for (const [oldPath, newPath] of [['/about/', '/despre-noi/'], ['/portfolio/', '/portofoliu/']]) {
      const res = await request.get(oldPath, { maxRedirects: 0 });
      expect.soft(res.status(), `status ${oldPath}`).toBe(301);
      expect.soft(new URL(res.headers()['location'] ?? '', res.url()).pathname, `Location ${oldPath}`).toBe(newPath);
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
    const all = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].trim()).pathname);
    const isArticle = (p: string) => /^\/articole\/[^/]+\/?$/.test(p);
    const norm = (p: string) => p.replace(/\/?$/, '/');
    // traducerile (/en/…, /de/… etc.) trebuie să fie versiuni ale unei pagini sau ale unui articol în română din sitemap
    const paths = all.filter((p) => splitLanguage(p).lang === 'ro');
    const inSitemap = new Set(paths.map(norm));
    const orphanTranslations = all.filter((p) => splitLanguage(p).lang !== 'ro' && !inSitemap.has(norm(splitLanguage(p).path)));
    expect(orphanTranslations, 'traduceri din sitemap fără pagina în română').toEqual([]);

    const known = new Set(PAGES.map((p) => norm(p.path)));
    const missing = paths.filter((p) => !isArticle(p) && !known.has(norm(p)));
    expect(missing, 'pagini din sitemap care lipsesc din PAGES (tests/fixtures/site.ts)').toEqual([]);
    const notInSitemap = PAGES.filter((p) => !inSitemap.has(norm(p.path))).map((p) => p.path);
    expect(notInSitemap, 'pagini din PAGES care lipsesc din sitemap').toEqual([]);

    const articole = new ArticolePage(page);
    await articole.open();
    const listed = new Set((await articole.articleUrls()).map((u) => norm(new URL(u).pathname)));
    const unlisted = paths.filter(isArticle).filter((p) => !listed.has(norm(p)));
    expect(unlisted, 'articole din sitemap care nu apar în /articole/ sau pe paginile de subiect').toEqual([]);
  });

  test('toate URL-urile din sitemap răspund 200', async ({ request }) => {
    test.slow();
    const res = await request.get('/sitemap.xml');
    test.skip(!res.ok(), 'sitemap.xml lipsește');
    // sitemap-ul are mereu adrese absolute de producție; verificăm aceeași cale pe ținta testată (beta local / staging)
    const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].trim()).pathname);
    const failed: string[] = [];
    for (const u of urls) {
      const r = await request.get(u, { maxRedirects: 0 });
      if (r.status() !== 200) failed.push(`${r.status()} ${u}`);
    }
    expect(failed, 'URL-uri din sitemap care nu dau 200 direct').toEqual([]);
  });

  // Fiecare pagină principală există în toate limbile: lang corect, canonical spre ea însăși și hreflang spre toate
  // versiunile (+ x-default spre română), ca Google să nu le trateze drept conținut duplicat.
  test('versiunile traduse ale paginilor au lang, canonical și hreflang corecte', async ({ request }) => {
    test.slow();
    const langs = ['ro', ...LANGUAGES];
    const problems: string[] = [];
    for (const p of PAGES) {
      for (const lang of langs) {
        const path = lang === 'ro' ? p.path : `/${lang}${p.path}`;
        const res = await request.get(path);
        if (res.status() !== 200) {
          problems.push(`${path}: status ${res.status()}`);
          continue;
        }
        const html = await res.text();
        const htmlLang = html.match(/<html[^>]*\slang="([^"]+)"/i)?.[1];
        if (htmlLang !== lang) problems.push(`${path}: <html lang="${htmlLang}">, așteptat "${lang}"`);
        const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
        if (!canonical || new URL(canonical).pathname !== path) problems.push(`${path}: canonical ${canonical ?? 'lipsă'}`);
        const alternates = new Map(
          [...html.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/gi)].map((m) => [m[1].toLowerCase(), new URL(m[2]).pathname]),
        );
        for (const l of [...langs, 'x-default']) {
          const expected = l === 'ro' || l === 'x-default' ? p.path : `/${l}${p.path}`;
          if (alternates.get(l) !== expected) problems.push(`${path}: hreflang ${l} = ${alternates.get(l) ?? 'lipsă'}, așteptat ${expected}`);
        }
      }
    }
    expect(problems, 'probleme pe versiunile traduse').toEqual([]);
  });
});
