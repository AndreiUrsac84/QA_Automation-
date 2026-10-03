import { test, expect, brokenImages } from './fixtures/site';

test.describe('Conținut – Articole', () => {
  test('lista de articole are carduri cu linkuri funcționale @smoke', async ({ page }) => {
    await page.goto('/articole/');
    const links = page.locator('main a[href*="/articole/"]').filter({ hasNotText: /^Articole$/ });
    const hrefs = [...new Set(await links.evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).href).filter((h) => !/\/articole\/?$/.test(h))))];
    expect(hrefs.length, 'cel puțin un articol publicat').toBeGreaterThan(0);
  });

  test('fiecare articol se deschide, are H1, conținut și imagini valide', async ({ page, consoleErrors }) => {
    test.slow();
    await page.goto('/articole/');
    const hrefs = [...new Set(await page.locator('a[href*="/articole/"]').evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).href.split('#')[0]).filter((h) => !/\/articole\/?$/.test(h))))];

    const problems: string[] = [];
    for (const href of hrefs) {
      const res = await page.goto(href);
      if (!res || res.status() >= 400) { problems.push(`${res?.status()} ${href}`); continue; }
      if ((await page.locator('h1').count()) !== 1) problems.push(`H1 != 1 pe ${href}`);
      const words = (await page.locator('main, article, body').first().innerText()).split(/\s+/).length;
      if (words < 150) problems.push(`conținut prea scurt (${words} cuvinte) pe ${href}`);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      if (!desc) problems.push(`fără meta description pe ${href}`);
      const broken = await brokenImages(page);
      if (broken.length) problems.push(`imagini rupte pe ${href}: ${broken.join(', ')}`);
    }
    expect(problems).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe('Conținut – Portofoliu', () => {
  test('categoriile de portofoliu sunt prezente', async ({ page }) => {
    await page.goto('/portfolio/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const cat of ['Locuințe', 'Edilitare', 'Hale', 'Internațional', 'Consultanță']) {
      await expect.soft(page.getByRole('heading', { name: new RegExp(cat, 'i') }).first(), cat).toBeVisible();
    }
  });
});

test.describe('Conținut – Home', () => {
  test('hero și argumentele principale', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/proiectare/i);
    await expect(page.getByText('Experiență', { exact: true })).toBeVisible();
    await expect(page.getByText('Seriozitate', { exact: true })).toBeVisible();
  });

  test('copyright-ul din footer e anul curent', async ({ page }) => {
    await page.goto('/');
    const year = new Date().getFullYear();
    await expect.soft(page.locator('footer'), `© ${year}`).toContainText(String(year));
  });
});
