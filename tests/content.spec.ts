import { test, expect } from './fixtures/site';
import { AboutPage, ArticolePage, GdprPage, HomePage, PortfolioPage } from '../Pages';
import { CommonsLocators } from '../Pages/LocatorsPage';

/** Locatorii sunt după id (Pages/LocatorsPage); verificările pe pagini sunt în Page Objects (Pages/). */
test.describe('Conținut – Articole', () => {
  test('lista de articole are carduri cu linkuri funcționale @smoke', async ({ page }) => {
    const articole = new ArticolePage(page);
    await articole.open();
    await expect(articole.articole.title).toBeVisible();
    await expect(articole.articole.list).toBeVisible();
    const hrefs = await articole.articleUrls();
    expect(hrefs.length, 'cel puțin un articol publicat').toBeGreaterThan(0);
    for (const href of hrefs) expect(new URL(href).pathname, 'link către un articol').toMatch(/^\/articole\/[a-z0-9-]+\/?$/);
  });

  test('fiecare articol se deschide, are titlu (id + H1), conținut și imagini valide', async ({ page, consoleErrors }) => {
    test.slow();
    const articole = new ArticolePage(page);
    await articole.open();
    const hrefs = await articole.articleUrls();
    expect(hrefs.length, 'cel puțin un articol publicat').toBeGreaterThan(0);

    const problems: string[] = [];
    for (const href of hrefs) problems.push(...(await articole.checkArticle(href)));
    expect(problems).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('un articol are titlu și breadcrumb spre listă', async ({ page }) => {
    const articole = new ArticolePage(page);
    await articole.open();
    const [first] = await articole.articleUrls();
    await page.goto(first);
    // imaginea principală există doar la unele articole (4 din 28), deci nu e obligatorie; imaginile rupte sunt verificate în checkArticle
    await expect(articole.articole.articleTitle).toBeVisible();
    await articole.articole.breadcrumbLink.click();
    await expect(page).toHaveURL(/\/articole\/?$/);
  });
});

test.describe('Conținut – Portofoliu', () => {
  test('categoriile de portofoliu sunt prezente', async ({ page }) => {
    const portfolio = new PortfolioPage(page);
    await portfolio.open();
    await portfolio.expectCategories();
  });
});

test.describe('Conținut – Home', () => {
  test('hero și argumentele principale', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.expectHero();
    await expect(home.home.description).toBeVisible();
    await expect(home.home.visualImage).toBeVisible();
    await expect(home.home.ctaPhone).toHaveAttribute('href', /^tel:/);
  });

  test('copyright-ul din footer e anul curent', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.expectCurrentYearInFooter();
    await expect(new CommonsLocators(page).copyright).toBeVisible();
  });
});

test.describe('Conținut – About Us', () => {
  test('toate secțiunile sunt prezente', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(about.about.title).toBeVisible();
    await about.expectSections();
  });

  test('„Cum lucrăm” are pașii listați', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    expect(await about.about.howWeWorkSteps.count(), 'pași în „Cum lucrăm”').toBeGreaterThan(0);
  });
});

test.describe('Conținut – GDPR', () => {
  test('cele 7 secțiuni ale politicii sunt prezente, cu linkurile de contact și ANSPDCP', async ({ page }) => {
    const gdpr = new GdprPage(page);
    await gdpr.open();
    await gdpr.expectSections();
    await expect(gdpr.gdpr.lastUpdated).toBeVisible();
    await expect(gdpr.gdpr.emailLink).toHaveAttribute('href', /^mailto:/);
    await expect(gdpr.gdpr.anspdcpLink).toHaveAttribute('href', /^https:\/\//);
  });
});
