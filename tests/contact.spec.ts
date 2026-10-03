import { test, expect, CONTACT } from './fixtures/site';
import type { Page, Request } from '@playwright/test';

/**
 * IMPORTANT: testele NU trimit mesaje reale. Orice request non-GET (POST la formular,
 * fetch, mailer) este interceptat și primește un 200 fals. Pentru un test real
 * de trimitere, rulează cu CONTACT_LIVE_SUBMIT=1 (vezi ultimul test).
 */
async function interceptSubmissions(page: Page) {
  const captured: Request[] = [];
  await page.route('**/*', async (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && req.method() !== 'HEAD' && req.resourceType() !== 'ping'
        && !/google|facebook|analytics/i.test(req.url())) {
      captured.push(req);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, success: true, message: 'E2E mock' }),
      });
    }
    return route.continue();
  });
  return captured;
}

const form = (page: Page) => page.locator('form').filter({ has: page.getByRole('button', { name: /Trimite/i }) });

test.describe('Pagina Contact', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/');
  });

  test('datele de contact sunt afișate și linkurile sunt corecte @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Contact' })).toBeVisible();
    await expect(page.locator(`a[href="mailto:${CONTACT.email}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="mailto:${CONTACT.emailAlt}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="${CONTACT.phoneTel}"]`).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'WhatsApp' }).first()).toHaveAttribute('href', CONTACT.whatsapp);
    await expect(page.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', /instagram\.com\/daurontrust/);
    await expect(page.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', /facebook\.com\/dauron\.trust/);
  });

  test('formularul conține toate câmpurile', async ({ page }) => {
    const f = form(page);
    await expect(f.getByLabel(/^Nume/i)).toBeVisible();
    await expect(f.getByLabel(/^Email/i)).toBeVisible();
    await expect(f.getByLabel(/Telefon/i)).toBeVisible();
    await expect(f.getByLabel(/Mesaj/i)).toBeVisible();
    await expect(f.getByRole('checkbox')).toBeVisible();
    await expect(f.getByRole('link', { name: /Politicii de confiden/i })).toHaveAttribute('href', /\/gdpr\/?$/);
    await expect(f.getByRole('button', { name: /Trimite mesaj/i })).toBeEnabled();
  });

  test('formular gol nu se trimite (validare)', async ({ page }) => {
    const captured = await interceptSubmissions(page);
    const f = form(page);
    await f.getByLabel(/Mesaj/i).fill('');
    await f.getByRole('button', { name: /Trimite/i }).click();
    await page.waitForTimeout(800);

    const valid = await f.evaluate((el) => (el as HTMLFormElement).checkValidity());
    expect(valid, 'formularul gol nu trebuie să fie valid').toBe(false);
    expect(captured, 'nu trebuie să plece niciun request').toHaveLength(0);
    await expect(page).toHaveURL(/\/contact\/?$/);
  });

  test('email invalid este respins', async ({ page }) => {
    const captured = await interceptSubmissions(page);
    const f = form(page);
    await f.getByLabel(/^Nume/i).fill('Test E2E');
    const email = f.getByLabel(/^Email/i);
    await email.fill('adresa-invalida');
    await f.getByLabel(/Mesaj/i).fill('Mesaj de test automat.');
    await f.getByRole('checkbox').check();
    await f.getByRole('button', { name: /Trimite/i }).click();
    await page.waitForTimeout(800);

    const emailValid = await email.evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(emailValid).toBe(false);
    expect(captured).toHaveLength(0);
  });

  test('fără acord GDPR formularul nu se trimite', async ({ page }) => {
    const captured = await interceptSubmissions(page);
    const f = form(page);
    await f.getByLabel(/^Nume/i).fill('Test E2E');
    await f.getByLabel(/^Email/i).fill('e2e@example.com');
    await f.getByLabel(/Mesaj/i).fill('Mesaj de test automat.');
    const cb = f.getByRole('checkbox');
    if (await cb.isChecked()) await cb.uncheck();
    await f.getByRole('button', { name: /Trimite/i }).click();
    await page.waitForTimeout(800);

    expect(captured, 'formularul nu trebuie trimis fără consimțământ GDPR').toHaveLength(0);
  });

  test('formular valid: trimite request-ul cu datele corecte (mock, fără email real)', async ({ page }) => {
    const captured = await interceptSubmissions(page);
    const f = form(page);
    await f.getByLabel(/^Nume/i).fill('Test E2E Playwright');
    await f.getByLabel(/^Email/i).fill('e2e@example.com');
    await f.getByLabel(/Telefon/i).fill('0700000000');
    await f.getByLabel(/Mesaj/i).fill('Mesaj generat automat de suita E2E. Ignorați.');
    await f.getByRole('checkbox').check();

    // Dacă formularul face POST clasic (navigare), o așteptăm; dacă e fetch, așteptăm request-ul.
    await Promise.all([
      page.waitForRequest((r) => r.method() === 'POST', { timeout: 10_000 }),
      f.getByRole('button', { name: /Trimite/i }).click(),
    ]);

    expect(captured.length).toBeGreaterThan(0);
    const body = captured[0].postData() ?? '';
    expect(body).toContain('e2e@example.com');
    expect(decodeURIComponent(body.replace(/\+/g, ' '))).toContain('Test E2E Playwright');
  });

  test('trimitere LIVE (doar manual, CONTACT_LIVE_SUBMIT=1)', async ({ page }) => {
    test.skip(process.env.CONTACT_LIVE_SUBMIT !== '1', 'dezactivat implicit – trimite email real');
    const f = form(page);
    await f.getByLabel(/^Nume/i).fill('TEST E2E – ignorați');
    await f.getByLabel(/^Email/i).fill(process.env.CONTACT_TEST_EMAIL ?? 'contact@dauron-trust.com');
    await f.getByLabel(/Mesaj/i).fill(`Test automat ${new Date().toISOString()}`);
    await f.getByRole('checkbox').check();
    await f.getByRole('button', { name: /Trimite/i }).click();
    await expect(page.getByText(/mul[tț]umim|trimis|succes/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
