import { test, expect, PAGES, PORTFOLIO_CATEGORIES, ARTICLES, LANGUAGES, brokenImages } from './fixtures/site';
import { ArticoleLocators, CommonsLocators } from '../Pages/LocatorsPage';

/**
 * Româna (fără prefix) + fiecare limbă tradusă (/<limbă>/<cale>/). Traducerile au aceleași id-uri ca pagina română,
 * doar textul diferă: pe ele titlul se verifică generic (conține `DAURON TRUST`), plus atributul lang.
 */
const LANGS = ['ro', ...LANGUAGES] as const;
const prefix = (lang: string) => (lang === 'ro' ? '' : `/${lang}`);
const label = (lang: string) => (lang === 'ro' ? '' : `[${lang}] `);

for (const lang of LANGS) {
  test.describe(`${label(lang)}Smoke – toate paginile principale @smoke`, () => {
    // + paginile de categorie din portofoliu: nu sunt în sitemap (noindex), dar se ajunge la ele din meniul portofoliului
    for (const p of [...PAGES, ...PORTFOLIO_CATEGORIES]) {
      const path = prefix(lang) + p.path;
      test(`${label(lang)}${p.name} (${path}) se încarcă fără erori`, async ({ page, consoleErrors }) => {
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

        expect(response, 'lipsește răspunsul HTTP').not.toBeNull();
        expect(response!.status(), `status HTTP pentru ${path}`).toBeLessThan(400);

        await expect(page.locator('html'), 'atributul lang').toHaveAttribute('lang', lang);
        // traducerile: „… | DAURON TRUST” sau, pe Home, „DAURON TRUST SRL – …”
        await expect(page).toHaveTitle(lang === 'ro' ? p.titleRe : /DAURON TRUST/);
        await expect(page.getByTestId(p.titleId), `titlul paginii (id ${p.titleId})`).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        await expect(new CommonsLocators(page).logoImage, 'logo în meniu').toBeVisible();

        const broken = await brokenImages(page);
        expect(broken, 'imagini rupte').toEqual([]);

        expect(consoleErrors, 'erori JS / consolă').toEqual([]);
      });
    }
  });

  /** Fiecare articol din sitemap (ARTICLES), cu aceleași verificări ca paginile principale. */
  test.describe(`${label(lang)}Smoke – articole @smoke`, () => {
    for (const a of ARTICLES) {
      const path = prefix(lang) + a.path;
      test(`${label(lang)}articol ${a.slug} se încarcă fără erori`, async ({ page, consoleErrors }) => {
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

        expect(response, 'lipsește răspunsul HTTP').not.toBeNull();
        expect(response!.status(), `status HTTP pentru ${path}`).toBeLessThan(400);

        await expect(page.locator('html'), 'atributul lang').toHaveAttribute('lang', lang);
        await expect(page).toHaveTitle(/\S.*DAURON TRUST/);
        await expect(new ArticoleLocators(page).articleTitle, 'titlul articolului (id articol-…-title)').toBeVisible();
        await expect(page.getByRole('heading', { level: 1 }), 'exact un H1').toHaveCount(1);
        await expect(new CommonsLocators(page).logoImage, 'logo în meniu').toBeVisible();

        const broken = await brokenImages(page);
        expect(broken, 'imagini rupte').toEqual([]);

        expect(consoleErrors, 'erori JS / consolă').toEqual([]);
      });
    }
  });
}

test.describe('Smoke – server @smoke', () => {
  test('HTTPS: http:// redirecționează spre https://', async ({ request, baseURL }) => {
    test.skip(!baseURL!.startsWith('https:'), 'mediul țintă nu are HTTPS (ex. BASE_URL_FALLBACK pe Docker local)');
    const httpUrl = baseURL!.replace(/^https:/, 'http:') + '/';
    const res = await request.get(httpUrl, { maxRedirects: 5 });
    expect(res.url()).toMatch(/^https:\/\//);
    expect(res.ok()).toBeTruthy();
  });

  test('pagină inexistentă întoarce 404', async ({ request }) => {
    const res = await request.get('/pagina-inexistenta-e2e-' + Date.now() + '/');
    expect(res.status()).toBe(404);
  });

  test('timp de încărcare acceptabil pe Home (< 4s DOMContentLoaded)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    const dcl = await page.evaluate(() => {
      const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return nav.domContentLoadedEventEnd - nav.startTime;
    });
    test.info().annotations.push({ type: 'DCL ms', description: String(Math.round(dcl)) });
    expect(dcl).toBeLessThan(4000);
  });
});
