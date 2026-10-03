import type { Locator, Page } from '@playwright/test';

/**
 * Locatori pagina Contact (/contact/).
 * Eticheta câmpurilor nu e legată de input pe site (fără for/htmlFor), deci getByLabel nu funcționează;
 * folosim placeholder-ul. Dacă site-ul repară etichetele, trecem pe getByLabel.
 */
export class ContactLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByRole('heading', { level: 1, name: 'Contact' }); }

  // Date de contact
  get emailLink(): Locator { return this.page.getByRole('link', { name: 'contact@dauron-trust.com' }).first(); }
  get emailAltLink(): Locator { return this.page.getByRole('link', { name: 'dauron.trust@gmail.com' }).first(); }
  get phoneLink(): Locator { return this.page.getByRole('link', { name: '0770 677 812' }); }
  get whatsappLink(): Locator { return this.page.getByRole('link', { name: 'WhatsApp', exact: true }); }
  get instagramLink(): Locator { return this.page.getByRole('link', { name: 'Instagram' }); }
  get facebookLink(): Locator { return this.page.getByRole('link', { name: 'Facebook' }); }

  // Formular
  get form(): Locator {
    return this.page.locator('form').filter({ has: this.page.getByRole('button', { name: /Trimite/i }) });
  }
  get nameInput(): Locator { return this.form.getByPlaceholder('Ing. / Beneficiar / Companie'); }
  get emailInput(): Locator { return this.form.getByPlaceholder('nume@domeniu.com'); }
  get phoneInput(): Locator { return this.form.getByPlaceholder('07xx xxx xxx'); }
  get messageInput(): Locator { return this.form.getByPlaceholder(/Descrie pe scurt/i); }
  get gdprCheckbox(): Locator { return this.form.getByRole('checkbox'); }
  get gdprPolicyLink(): Locator { return this.form.getByRole('link', { name: /Politicii de confiden/i }); }
  get submitButton(): Locator { return this.form.getByRole('button', { name: /Trimite mesaj/i }); }
}
