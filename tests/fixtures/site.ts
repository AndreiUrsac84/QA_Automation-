import { test as base, expect, type Page } from '@playwright/test';
import { CommonPages } from '../../Pages/CommonPages';

/** Paginile principale ale site-ului. Actualizează aici când apare o pagină nouă. */
export const PAGES = [
  { path: '/', name: 'Home', titleRe: /DAURON TRUST/i },
  { path: '/about/', name: 'About Us', titleRe: /DAURON TRUST/i },
  { path: '/portfolio/', name: 'Portofoliu', titleRe: /Portofoliu/i },
  { path: '/articole/', name: 'Articole', titleRe: /Articole/i },
  { path: '/contact/', name: 'Contact', titleRe: /Contact/i },
  { path: '/gdpr/', name: 'GDPR', titleRe: /DAURON TRUST|confiden/i },
] as const;

export const NAV_ITEMS = [
  { label: 'Home', href: /\/$/ },
  { label: 'About Us', href: /\/about\/?$/ },
  { label: 'Portofoliu', href: /\/portfolio\/?$/ },
  { label: 'Articole', href: /\/articole\/?$/ },
  { label: 'Contact', href: /\/contact\/?$/ },
] as const;

export const CONTACT = {
  email: 'contact@dauron-trust.com',
  emailAlt: 'dauron.trust@gmail.com',
  phoneTel: 'tel:+40770677812',
  whatsapp: /wa\.me\/40770677812/,
};

/** Erori de consolă ignorate (zgomot de la terți: analytics, extensii, favicon etc.). */
const IGNORED_CONSOLE = [/favicon/i, /googletagmanager|google-analytics|gtag/i, /facebook|fbevents/i];

type Fixtures = {
  consoleErrors: string[];
};

/** După fiecare page.goto() rămâne PAGE_PAUSE_MS pe pagină (1s implicit; PAGE_PAUSE_MS=0 dezactivează). */
const withPagePause = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = (async (url, options) => {
      const response = await goto(url, options);
      await new CommonPages(page).pause();
      return response;
    }) as typeof page.goto;
    await use(page);
  },
});

/**
 * Fixture care colectează erorile de consolă + excepțiile JS din pagină.
 * Testele care vor să le verifice apelează expect(consoleErrors).toEqual([]).
 */
export const test = withPagePause.extend<Fixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
      errors.push(`[console] ${text}`);
    });
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
    await use(errors);
  },
});

export { expect };

/** Bannerul de cookie-uri (GDPR): butoanele „Accept” / „Refuz”. */
export const cookieBanner = (page: Page) => page.getByRole('button', { name: 'Accept', exact: true });

/** Apasă „Accept” pe bannerul de cookie-uri, dacă este afișat. */
export async function acceptCookies(page: Page): Promise<void> {
  const accept = cookieBanner(page);
  if (await accept.isVisible().catch(() => false)) await accept.click();
}

/** Imagini încărcate efectiv dar cu naturalWidth 0 = imagini rupte. */
export async function brokenImages(page: Page): Promise<string[]> {
  await page.evaluate(async () => {
    // forțează lazy-load
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  return page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0 && img.src)
      .map((img) => img.currentSrc || img.src),
  );
}
