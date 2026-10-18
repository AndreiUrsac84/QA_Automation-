import type { Locator, Page } from '@playwright/test';

/**
 * Locatori pagina Contact (/contact/), după id.
 * Câmpul `contact-honeypot-input` este o capcană pentru boți: testele nu îl completează niciodată.
 */
export class ContactLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByTestId('contact-title'); }

  // Date de contact
  get emailLink(): Locator { return this.page.getByTestId('contact-link-email'); }
  get emailAltLink(): Locator { return this.page.getByTestId('contact-link-email-alt'); }
  get phoneLink(): Locator { return this.page.getByTestId('contact-link-phone'); }
  get whatsappLink(): Locator { return this.page.getByTestId('contact-link-whatsapp'); }
  get instagramLink(): Locator { return this.page.getByTestId('contact-link-instagram'); }
  get facebookLink(): Locator { return this.page.getByTestId('contact-link-facebook'); }

  // Formular
  get form(): Locator { return this.page.getByTestId('contact-form'); }
  get nameInput(): Locator { return this.page.getByTestId('contact-name-input'); }
  get emailInput(): Locator { return this.page.getByTestId('contact-email-input'); }
  get phoneInput(): Locator { return this.page.getByTestId('contact-phone-input'); }
  get messageInput(): Locator { return this.page.getByTestId('contact-message-input'); }
  get gdprCheckbox(): Locator { return this.page.getByTestId('contact-gdpr-checkbox'); }
  get gdprPolicyLink(): Locator { return this.page.getByTestId('contact-link-gdpr'); }
  get submitButton(): Locator { return this.page.getByTestId('contact-submit-button'); }

  // Mesaje de eroare (validarea se face în JS, nu prin HTML5: câmpul de email este type="text")
  get emailError(): Locator { return this.page.getByTestId('contact-email-error'); }
  get statusError(): Locator { return this.page.getByTestId('contact-status-error'); }

  // Etichetele câmpurilor
  get nameLabel(): Locator { return this.page.getByTestId('contact-name-label'); }
  get emailLabel(): Locator { return this.page.getByTestId('contact-email-label'); }
  get phoneLabel(): Locator { return this.page.getByTestId('contact-phone-label'); }
  get messageLabel(): Locator { return this.page.getByTestId('contact-message-label'); }
  get gdprLabel(): Locator { return this.page.getByTestId('contact-gdpr-label'); }
}
