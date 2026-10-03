import { test, expect, PAGES, brokenImages } from './fixtures/site';

test.describe('Smoke – toate paginile principale @smoke', () => {
  for (const p of PAGES) {
    test(`${p.name} (${p.path}) se încarcă fără erori`, async ({ page, consoleErrors }) => {
      const response = await page.goto(p.path, { waitUntil: 'domcontentloaded' });

      expect(response, 'lipsește răspunsul HTTP').not.toBeNull();
      expect(response!.status(), `status HTTP pentru ${p.path}`).toBeLessThan(400);

      await expect(page).toHaveTitle(p.titleRe);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.getByRole('img', { name: /DAURON TRUST logo/i }).first()).toBeVisible();

      const broken = await brokenImages(page);
      expect(broken, 'imagini rupte').toEqual([]);

      expect(consoleErrors, 'erori JS / consolă').toEqual([]);
    });
  }

  test('HTTPS: http:// redirecționează spre https://', async ({ request, baseURL }) => {
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
