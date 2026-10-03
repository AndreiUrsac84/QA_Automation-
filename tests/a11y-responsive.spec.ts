import AxeBuilder from '@axe-core/playwright';
import { test, expect, PAGES } from './fixtures/site';

test.describe('Accesibilitate (axe-core, WCAG 2.1 AA)', () => {
  for (const p of PAGES) {
    test(`fără încălcări critice/serioase pe ${p.path}`, async ({ page }) => {
      await page.goto(p.path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const severe = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      const summary = severe.map((v) => `${v.impact} | ${v.id}: ${v.help} (${v.nodes.length} elemente)`);
      await test.info().attach('axe-violations.json', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });
      expect(summary).toEqual([]);
    });
  }
});

test.describe('Responsive', () => {
  for (const p of PAGES) {
    test(`fără scroll orizontal pe ${p.path}`, async ({ page }) => {
      await page.goto(p.path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'conținutul depășește lățimea ecranului (px)').toBeLessThanOrEqual(1);
    });
  }

  test('ținte de atingere suficiente pe mobil (≥ 24px)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'doar pe mobil');
    await page.goto('/');
    const small = await page.$$eval('a, button', (els) =>
      els
        .filter((e) => (e as HTMLElement).offsetParent !== null)
        .map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30), r: e.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && (r.width < 24 || r.height < 24))
        .map(({ t, r }) => `${t} ${Math.round(r.width)}x${Math.round(r.height)}`),
    );
    expect.soft(small).toEqual([]);
  });
});
