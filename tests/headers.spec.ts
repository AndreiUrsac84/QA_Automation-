import { test, expect, PAGES } from './fixtures/site';

/**
 * Headere HTTP de securitate și cache (raportul din 2026-10-12, §1 și §4): după ce au fost reparate pe site,
 * testul le păzește ca să nu dispară la un release (ex. un .htaccess suprascris).
 * Testele sunt doar request-uri HTTP, deci rulează o singură dată (desktop-chrome).
 */
test.describe('Headere HTTP', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop-chrome', 'doar request-uri HTTP, rulează o singură dată');
  });

  for (const p of PAGES) {
    test(`headere de securitate pe ${p.path}`, async ({ request, baseURL }) => {
      const res = await request.get(p.path);
      expect(res.status(), `status ${p.path}`).toBe(200);
      const h = res.headers();

      expect.soft(h['x-content-type-options'], 'X-Content-Type-Options').toBe('nosniff');
      expect.soft(h['x-frame-options'], 'X-Frame-Options').toMatch(/^sameorigin$/i);
      expect.soft(h['referrer-policy'], 'Referrer-Policy').toBe('strict-origin-when-cross-origin');
      // HSTS are sens doar pe HTTPS (lipsește normal pe containerul local http://localhost:8080)
      if (baseURL!.startsWith('https:')) {
        expect.soft(h['strict-transport-security'], 'Strict-Transport-Security').toMatch(/max-age=\d{7,}/);
      }
      // HTML-ul nu se ține în cache fără revalidare, altfel vizitatorii văd versiunea veche după release
      expect.soft(h['cache-control'], 'Cache-Control pe HTML').toMatch(/no-cache|max-age=0/);
    });
  }

  test('resursele statice au cache lung', async ({ request, page }) => {
    await page.goto('/');
    const script = await page.locator('script[src*="/_next/static/"]').first().getAttribute('src');
    expect(script, 'niciun script din /_next/static/ pe Home').toBeTruthy();

    const res = await request.get(script!);
    expect(res.status()).toBe(200);
    const maxAge = Number(res.headers()['cache-control']?.match(/max-age=(\d+)/)?.[1] ?? 0);
    expect(maxAge, `Cache-Control pe ${script}: ${res.headers()['cache-control']}`).toBeGreaterThanOrEqual(7 * 24 * 3600);
  });
});
