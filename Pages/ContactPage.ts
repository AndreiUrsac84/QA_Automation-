import type { Page, Request } from '@playwright/test';
import { BasePage } from './BasePage';
import { ContactLocators } from './LocatorsPage';

/** Doar aceste trackere trec nemockuite; orice alt request non-GET (inclusiv alte servicii Google) este interceptat. */
const TRACKERS = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|connect\.facebook\.net|facebook\.com\/tr/i;

export type ContactData = { name?: string; email?: string; phone?: string; message?: string; gdpr?: boolean };

export class ContactPage extends BasePage {
  readonly contact: ContactLocators;

  constructor(page: Page) {
    super(page, '/contact/');
    this.contact = new ContactLocators(page);
  }

  /**
   * Interceptează orice request non-GET (POST formular, fetch, mailer) și întoarce un 200 fals,
   * ca testele să NU trimită mesaje reale. Întoarce lista requesturilor capturate.
   */
  async interceptSubmissions(): Promise<Request[]> {
    const captured: Request[] = [];
    await this.page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() !== 'GET' && req.method() !== 'HEAD' && req.resourceType() !== 'ping'
          && !TRACKERS.test(req.url())) {
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

  /** Completează formularul; `gdpr: true` bifează acordul, `gdpr: false` îl debifează. */
  async fillForm(d: ContactData): Promise<void> {
    const c = this.contact;
    if (d.name !== undefined) await c.nameInput.fill(d.name);
    if (d.email !== undefined) await c.emailInput.fill(d.email);
    if (d.phone !== undefined) await c.phoneInput.fill(d.phone);
    if (d.message !== undefined) await c.messageInput.fill(d.message);
    if (d.gdpr === true) await c.gdprCheckbox.check();
    if (d.gdpr === false && (await c.gdprCheckbox.isChecked())) await c.gdprCheckbox.uncheck();
  }

  async submit(): Promise<void> {
    await this.contact.submitButton.click();
  }

  /** Formularul trece de validarea HTML5 a browserului? */
  async isFormValid(): Promise<boolean> {
    return this.contact.form.evaluate((el) => (el as HTMLFormElement).checkValidity());
  }

  async isEmailFieldValid(): Promise<boolean> {
    return this.contact.emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
  }
}
