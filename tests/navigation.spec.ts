import { test, expect, PAGES, NAV_ITEMS, CONTACT, cookieBanner } from './fixtures/site';

test.describe('Navigare și elemente comune', () => {
  for (const p of PAGES) {
    test(`meniul are toate linkurile corecte pe ${p.path}`, async ({ page, isMobile }) => {
      await page.goto(p.path);

      // Pe mobil meniul poate fi ascuns sub un buton hamburger
      if (isMobile) {
        const toggle = page.getByRole('button', { name: /meniu|menu|navigat/i })
          .or(page.locator('[aria-controls], .menu-toggle, .hamburger, .navbar-toggler').first());
        if (await toggle.first().isVisible().catch(() => false)) await toggle.first().click();
      }

      for (const item of NAV_ITEMS) {
        const link = page.getByRole('navigation').getByRole('link', { name: item.label, exact: true })
          .or(page.locator('header').getByRole('link', { name: item.label, exact: true }))
          .first();
        await expect(link, `link "${item.label}"`).toHaveAttribute('href', item.href);
      }
    });

    test(`footer: GDPR + WhatsApp pe ${p.path}`, async ({ page }) => {
      await page.goto(p.path);
      const footer = page.locator('footer');
      await expect(footer.getByRole('link', { name: /confiden|GDPR/i }).first()).toHaveAttribute('href', /\/gdpr\/?$/);
      await expect(page.locator(`a[href*="wa.me"]`).first()).toHaveAttribute('href', CONTACT.whatsapp);
      await expect(footer).toContainText(/DAURON TRUST SRL/);
    });
  }

  test('click pe fiecare item din meniu duce la pagina corectă @smoke', async ({ page, isMobile }) => {
    test.skip(isMobile, 'navigarea prin click e acoperită pe desktop');
    await page.goto('/');
    for (const item of NAV_ITEMS) {
      await page.locator('header, nav').getByRole('link', { name: item.label, exact: true }).first().click();
      await expect(page).toHaveURL(item.href);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('banner cookie-uri GDPR: „Accept” îl închide și alegerea se păstrează @smoke', async ({ page }) => {
    await page.goto('/');
    const accept = cookieBanner(page);
    await expect(accept, 'bannerul de cookie-uri trebuie afișat la prima vizită').toBeVisible();
    await expect(page.getByRole('button', { name: 'Refuz', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Politica de/i }).first()).toHaveAttribute('href', /\/gdpr\/?$/);

    await accept.click();
    await expect(accept).toBeHidden();

    await page.reload();
    await expect(accept, 'după acceptare bannerul nu mai trebuie să reapară').toBeHidden();
  });

  test('logo duce la Home', async ({ page }) => {
    await page.goto('/contact/');
    await page.getByRole('link', { name: /DAURON TRUST/i }).first().click();
    await expect(page).toHaveURL(/dauron-trust\.com\/?$/);
  });

  test('CTA-urile din Home: „Vezi portofoliul” și „Cere o ofertă” @smoke', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Vezi portofoliul/i }).click();
    await expect(page).toHaveURL(/\/portfolio\/?$/);
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: /Cere o ofert/i }).click();
    await expect(page).toHaveURL(/\/contact\/?$/);
  });
});
