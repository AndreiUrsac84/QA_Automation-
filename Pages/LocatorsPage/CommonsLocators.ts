import type { Locator, Page } from '@playwright/test';

/** Id-urile link-urilor din meniu, după eticheta afișată. */
const NAV_IDS: Record<string, string> = {
  'Home': 'menu-home-link',
  'About Us': 'menu-about-link',
  'Portofoliu': 'menu-portfolio-link',
  'Articole': 'menu-articole-link',
  'Contact': 'menu-contact-link',
};

/** Locatori comuni tuturor paginilor (după id): header/meniu, footer, banner cookie-uri, WhatsApp. */
export class CommonsLocators {
  constructor(private readonly page: Page) {}

  // Header / meniu
  get header(): Locator { return this.page.getByTestId('menu'); }
  get main(): Locator { return this.page.getByTestId('app-main'); }
  get logo(): Locator { return this.page.getByTestId('menu-logo'); }
  get logoImage(): Locator { return this.page.getByTestId('menu-logo-image'); }
  navLink(label: string): Locator {
    const id = NAV_IDS[label];
    if (!id) throw new Error(`Element de meniu necunoscut: "${label}"`);
    return this.page.getByTestId(id);
  }
  get h1(): Locator { return this.page.getByRole('heading', { level: 1 }); }

  // Meniul Articole (▾): subiectele articolelor
  get subjectsButton(): Locator { return this.page.getByTestId('menu-articole-button'); }
  get subjectsDropdown(): Locator { return this.page.getByTestId('menu-articole-dropdown'); }
  /** Linkul spre /articole/subiect/<slug>/; id-ul are forma menu-articole-<slug>-link. */
  subjectLink(slug: string): Locator { return this.page.getByTestId(`menu-articole-${slug}-link`); }
  get allArticlesLink(): Locator { return this.page.getByTestId('menu-articole-toate-link'); }

  // Meniul de limbă
  get languageButton(): Locator { return this.page.getByTestId('menu-limba-button'); }
  get languageDropdown(): Locator { return this.page.getByTestId('menu-limba-dropdown'); }
  /** Linkul spre aceeași pagină în limba dată (ro, en, it, es, de, hu). */
  languageLink(lang: string): Locator { return this.page.getByTestId(`menu-limba-link-${lang}`); }

  // Footer
  get footer(): Locator { return this.page.getByTestId('footer'); }
  get footerGdprLink(): Locator { return this.page.getByTestId('footer-link-gdpr'); }
  get copyright(): Locator { return this.page.getByTestId('footer-link-copyright'); }

  // WhatsApp (buton plutitor)
  get whatsappButton(): Locator { return this.page.getByTestId('whatsapp-floating-button'); }

  // Banner cookie-uri (GDPR)
  get cookieBanner(): Locator { return this.page.getByTestId('cookie-banner'); }
  get cookieAccept(): Locator { return this.page.getByTestId('cookie-accept-button'); }
  get cookieRefuse(): Locator { return this.page.getByTestId('cookie-reject-button'); }
  get cookiePolicyLink(): Locator { return this.page.getByTestId('cookie-banner-link-gdpr'); }
}
