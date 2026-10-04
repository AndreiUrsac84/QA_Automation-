import { test, expect, CONTACT } from './fixtures/site';
import { ContactPage } from '../Pages';

/**
 * IMPORTANT: testele NU trimit mesaje reale. Orice request non-GET (POST la formular,
 * fetch, mailer) este interceptat de ContactPage.interceptSubmissions și primește un 200 fals.
 * Pentru un test real de trimitere, rulează cu CONTACT_LIVE_SUBMIT=1 (vezi ultimul test).
 * Câmpul-capcană `contact-honeypot-input` nu este completat niciodată.
 */
test.describe('Pagina Contact', () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.open();
    // bannerul fix din josul paginii poate acoperi butonul „Trimite”
    await contactPage.acceptCookies();
  });

  test('datele de contact sunt afișate și linkurile sunt corecte @smoke', async () => {
    const c = contactPage.contact;
    await expect(c.title).toBeVisible();
    await expect(c.emailLink).toHaveAttribute('href', `mailto:${CONTACT.email}`);
    await expect(c.emailAltLink).toHaveAttribute('href', `mailto:${CONTACT.emailAlt}`);
    await expect(c.phoneLink).toHaveAttribute('href', CONTACT.phoneTel);
    await expect(c.whatsappLink).toHaveAttribute('href', CONTACT.whatsapp);
    await expect(c.instagramLink).toHaveAttribute('href', /instagram\.com\/daurontrust/);
    await expect(c.facebookLink).toHaveAttribute('href', /facebook\.com\/dauron\.trust/);
  });

  test('formularul conține toate câmpurile', async () => {
    const c = contactPage.contact;
    for (const field of [c.nameInput, c.emailInput, c.phoneInput, c.messageInput, c.gdprCheckbox]) {
      await expect(field).toBeVisible();
    }
    for (const label of [c.nameLabel, c.emailLabel, c.phoneLabel, c.messageLabel, c.gdprLabel]) {
      await expect(label).toBeVisible();
    }
    await expect(c.gdprPolicyLink).toHaveAttribute('href', /\/gdpr\/?$/);
    await expect(c.submitButton).toBeEnabled();
  });

  test('formular gol nu se trimite (validare)', async ({ page }) => {
    const captured = await contactPage.interceptSubmissions();
    await contactPage.submit();
    await page.waitForTimeout(800);

    expect(await contactPage.isFormValid(), 'formularul gol nu trebuie să fie valid').toBe(false);
    expect(captured, 'nu trebuie să plece niciun request').toHaveLength(0);
    await expect(page).toHaveURL(/\/contact\/?$/);
  });

  test('email invalid este respins', async ({ page }) => {
    const captured = await contactPage.interceptSubmissions();
    await contactPage.fillForm({ name: 'Test E2E', email: 'adresa-invalida', message: 'Mesaj de test automat.', gdpr: true });
    await contactPage.submit();
    await page.waitForTimeout(800);

    expect(await contactPage.isEmailFieldValid()).toBe(false);
    expect(captured).toHaveLength(0);
  });

  test('fără acord GDPR formularul nu se trimite', async ({ page }) => {
    const captured = await contactPage.interceptSubmissions();
    await contactPage.fillForm({ name: 'Test E2E', email: 'e2e@example.com', message: 'Mesaj de test automat.', gdpr: false });
    await contactPage.submit();
    await page.waitForTimeout(800);

    expect(captured, 'formularul nu trebuie trimis fără consimțământ GDPR').toHaveLength(0);
  });

  test('formular valid: trimite request-ul cu datele corecte (mock, fără email real)', async ({ page }) => {
    const captured = await contactPage.interceptSubmissions();
    await contactPage.fillForm({
      name: 'Test E2E Playwright',
      email: 'e2e@example.com',
      phone: '0700000000',
      message: 'Mesaj generat automat de suita E2E. Ignorați.',
      gdpr: true,
    });

    // Dacă formularul face POST clasic (navigare), o așteptăm; dacă e fetch, așteptăm request-ul.
    await Promise.all([page.waitForRequest((r) => r.method() === 'POST', { timeout: 10_000 }), contactPage.submit()]);

    expect(captured.length).toBeGreaterThan(0);
    const body = captured[0].postData() ?? '';
    expect(body).toContain('e2e@example.com');
    expect(decodeURIComponent(body.replace(/\+/g, ' '))).toContain('Test E2E Playwright');
  });

  test('trimitere LIVE (doar manual, CONTACT_LIVE_SUBMIT=1)', async ({ page }) => {
    test.skip(process.env.CONTACT_LIVE_SUBMIT !== '1', 'dezactivat implicit – trimite email real');
    await contactPage.fillForm({
      name: 'TEST E2E – ignorați',
      email: process.env.CONTACT_TEST_EMAIL ?? 'contact@dauron-trust.com',
      message: `Test automat ${new Date().toISOString()}`,
      gdpr: true,
    });
    await contactPage.submit();
    await expect(page.getByText(/mul[tț]umim|trimis|succes/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
