import { test, expect, PAGES, NAV_ITEMS, CONTACT, LANGUAGES } from './fixtures/site';
import { CommonsLocators } from '../Pages/LocatorsPage';
import { HomePage, PortfolioPage } from '../Pages';

/** Locatorii sunt după id (getByTestId, vezi Pages/LocatorsPage); textul/rolul rămân doar unde site-ul nu are id. */
test.describe('Navigare și elemente comune', () => {
  for (const p of PAGES) {
    test(`meniul are toate linkurile corecte pe ${p.path}`, async ({ page }) => {
      await page.goto(p.path);
      const commons = new CommonsLocators(page);
      for (const item of NAV_ITEMS) {
        await expect(commons.navLink(item.label), `link "${item.label}"`).toBeVisible();
        await expect(commons.navLink(item.label), `href "${item.label}"`).toHaveAttribute('href', item.href);
      }
    });

    test(`footer: GDPR + WhatsApp pe ${p.path}`, async ({ page }) => {
      await page.goto(p.path);
      const commons = new CommonsLocators(page);
      await expect(commons.footerGdprLink).toHaveAttribute('href', /\/gdpr\/?$/);
      await expect(commons.whatsappButton).toHaveAttribute('href', CONTACT.whatsapp);
      await expect(commons.footer).toContainText(/DAURON TRUST SRL/);
    });
  }

  test('click pe fiecare item din meniu duce la pagina corectă @smoke', async ({ page }) => {
    await page.goto('/');
    const commons = new CommonsLocators(page);
    for (const [i, item] of NAV_ITEMS.entries()) {
      await commons.navLink(item.label).click();
      await expect(page).toHaveURL(item.href);
      await expect(page.getByTestId(PAGES[i].titleId), `titlul paginii ${item.label}`).toBeVisible();
    }
  });

  test('banner cookie-uri GDPR: „Accept” îl închide și alegerea se păstrează @smoke', async ({ page }) => {
    await page.goto('/');
    const commons = new CommonsLocators(page);
    await expect(commons.cookieBanner, 'bannerul de cookie-uri trebuie afișat la prima vizită').toBeVisible();
    await expect(commons.cookieAccept).toBeVisible();
    await expect(commons.cookieRefuse).toBeVisible();
    await expect(commons.cookiePolicyLink).toHaveAttribute('href', /\/gdpr\/?$/);

    await commons.cookieAccept.click();
    await expect(commons.cookieBanner).toBeHidden();

    await page.reload();
    await expect(commons.cookieBanner, 'după acceptare bannerul nu mai trebuie să reapară').toBeHidden();
  });

  test('banner cookie-uri GDPR: „Refuz” îl închide', async ({ page }) => {
    await page.goto('/');
    const commons = new CommonsLocators(page);
    await commons.cookieRefuse.click();
    await expect(commons.cookieBanner).toBeHidden();
  });

  test('meniul Articole (▾) listează subiectele și duce la pagina subiectului @smoke', async ({ page }) => {
    await page.goto('/');
    const commons = new CommonsLocators(page);
    await expect(commons.subjectsButton).toHaveAttribute('aria-expanded', 'false');
    await commons.subjectsButton.click();
    await expect(commons.subjectsButton).toHaveAttribute('aria-expanded', 'true');
    await expect(commons.subjectsDropdown).toBeVisible();

    const subjects = PAGES.filter((p) => p.path.startsWith('/articole/subiect/'));
    for (const s of subjects) {
      const slug = s.path.split('/').filter(Boolean).pop()!;
      await expect.soft(commons.subjectLink(slug), `subiectul ${slug} în meniu`).toHaveAttribute('href', s.path);
    }
    await expect(commons.allArticlesLink).toHaveAttribute('href', /\/articole\/?$/);

    await page.keyboard.press('Escape');
    await expect(commons.subjectsButton, 'Escape închide meniul').toHaveAttribute('aria-expanded', 'false');

    const [first] = subjects;
    await commons.subjectsButton.click();
    await commons.subjectLink(first.path.split('/').filter(Boolean).pop()!).click();
    await expect(page).toHaveURL(new RegExp(`${first.path}$`));
    await expect(page.getByTestId(first.titleId)).toBeVisible();
  });

  test('meniul de limbă duce la aceeași pagină în limba aleasă și înapoi @smoke', async ({ page }) => {
    const about = PAGES.find((p) => p.path === '/despre-noi/')!;
    await page.goto(about.path);
    const commons = new CommonsLocators(page);
    await commons.languageButton.click();
    await expect(commons.languageButton).toHaveAttribute('aria-expanded', 'true');
    await expect(commons.languageDropdown).toBeVisible();
    await expect(commons.languageLink('ro'), 'limba curentă marcată').toHaveAttribute('aria-current', 'true');
    for (const lang of LANGUAGES) {
      await expect.soft(commons.languageLink(lang), `link ${lang}`).toHaveAttribute('href', `/${lang}${about.path}`);
    }

    await commons.languageLink('en').click();
    await expect(page).toHaveURL(/\/en\/despre-noi\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId(about.titleId)).toBeVisible();
    // meniul rămâne în limba aleasă
    for (const item of NAV_ITEMS) {
      await expect.soft(commons.navLink(item.label), `meniul în engleză: ${item.label}`).toHaveAttribute('href', /^\/en\//);
    }

    await commons.languageButton.click();
    await expect(commons.languageLink('en'), 'limba curentă marcată').toHaveAttribute('aria-current', 'true');
    await commons.languageLink('ro').click();
    await expect(page).toHaveURL(/\/despre-noi\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ro');
  });

  test('logo duce la Home', async ({ page }) => {
    await page.goto('/contact/');
    await new CommonsLocators(page).logo.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-title')).toBeVisible();
  });

  test('CTA-urile din Home: „Vezi portofoliul” și „Cere o ofertă” @smoke', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.openPortfolioFromCta();
    await expect(new PortfolioPage(page).portfolio.title).toBeVisible();

    await home.open();
    await home.openOfferFromCta();
    await expect(page.getByTestId('contact-title')).toBeVisible();
  });
});
