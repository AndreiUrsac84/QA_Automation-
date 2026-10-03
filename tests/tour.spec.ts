import { test, expect } from '@playwright/test';
import { PAGES } from './fixtures/site';
import { CommonPages } from '../Pages/CommonPages';
import { ArticolePage } from '../Pages/ArticolePage';

/**
 * Tur prin toate paginile site-ului și prin fiecare articol: fiecare rămâne deschisă TOUR_PAGE_SECONDS (implicit 3s).
 * O singură trecere. Repetarea (20 de cicluri, la 10 minute) o face scriptul: npm run test:tour
 * Folosește `test` din Playwright direct, ca să nu se adune pauza din fixture cu cea de aici.
 */
const SECONDS_PER_PAGE = Number(process.env.TOUR_PAGE_SECONDS ?? 6);

test('tur prin toate paginile și articolele, câte 6 secunde pe fiecare', async ({ page }) => {
  test.setTimeout(60_000 + PAGES.length * SECONDS_PER_PAGE * 1000);
  const helpers = new CommonPages(page);

  for (const p of PAGES) {
    await test.step(`${p.name} (${p.path})`, async () => {
      const res = await page.goto(p.path);
      expect(res?.status(), `status HTTP pe ${p.path}`).toBeLessThan(400);
      await expect(page).toHaveTitle(p.titleRe);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await helpers.pause(SECONDS_PER_PAGE * 1000);
    });
  }

  // Articolele: lista se citește de pe site, deci tururile prind și articolele noi.
  const articole = new ArticolePage(page);
  await articole.open();
  const urls = await articole.articleUrls();
  expect(urls.length, 'cel puțin un articol publicat').toBeGreaterThan(0);
  test.setTimeout(60_000 + (PAGES.length + urls.length) * (SECONDS_PER_PAGE * 1000 + 5_000));

  for (const url of urls) {
    await test.step(`Articol ${new URL(url).pathname}`, async () => {
      const res = await page.goto(url);
      expect(res?.status(), `status HTTP pe ${url}`).toBeLessThan(400);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await helpers.pause(SECONDS_PER_PAGE * 1000);
    });
  }
});
