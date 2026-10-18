import { test as base, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { CommonPages } from '../../Pages/CommonPages';

/**
 * Paginile principale ale site-ului. Actualizează aici când apare o pagină nouă (testul „sitemap vs PAGES” din
 * seo.spec.ts pică dacă sitemap-ul conține o pagină care lipsește de aici).
 * `titleId` = id-ul titlului paginii (H1) – verificat primul, înaintea rolului/textului.
 */
export const PAGES = [
  { path: '/', name: 'Home', titleId: 'home-title', titleRe: /DAURON TRUST SRL.*Proiectare Construc/i },
  { path: '/despre-noi/', name: 'About Us', titleId: 'about-title', titleRe: /Despre noi.*DAURON TRUST/i },
  { path: '/portofoliu/', name: 'Portofoliu', titleId: 'portfolio-title', titleRe: /Portofoliu.*DAURON TRUST/i },
  { path: '/articole/', name: 'Articole', titleId: 'articole-title', titleRe: /Articole.*DAURON TRUST/i },
  { path: '/contact/', name: 'Contact', titleId: 'contact-title', titleRe: /Contact.*DAURON TRUST/i },
  { path: '/gdpr/', name: 'GDPR', titleId: 'gdpr-title', titleRe: /Politica de confiden.*DAURON TRUST/i },
] as const;

/**
 * Articolele (/articole/<slug>/), citite din sitemap.xml al țintei la colectarea testelor, ca fiecare articol să aibă
 * testele lui (smoke, SEO, search) în raport. Nu se întrețin manual. Listă goală = sitemap inaccesibil:
 * testul „sitemap-ul conține articole” din search.spec.ts pică.
 */
export const ARTICLES: readonly { path: string; slug: string }[] = loadArticles();

function loadArticles(): { path: string; slug: string }[] {
  const target = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'https://dauron-trust.com';
  // colectarea testelor e sincronă, deci sitemap-ul se citește într-un proces separat (fetch e asincron)
  const fetchScript = 'fetch(process.argv[1]).then(r=>r.ok?r.text():Promise.reject(r.status)).then(t=>process.stdout.write(t),()=>process.exit(1))';
  let xml = '';
  try {
    xml = execFileSync(process.execPath, ['-e', fetchScript, new URL('/sitemap.xml', target).href], { encoding: 'utf8', timeout: 20_000 });
  } catch {
    return [];
  }
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].trim()).pathname);
  return [...new Set(paths)]
    .filter((p) => /^\/articole\/[^/]+\/?$/.test(p))
    .map((path) => ({ path, slug: path.split('/').filter(Boolean)[1] }));
}

export const NAV_ITEMS = [
  { label: 'Home', href: /\/$/ },
  { label: 'About Us', href: /\/despre-noi\/?$/ },
  { label: 'Portofoliu', href: /\/portofoliu\/?$/ },
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
      // „Failed to load resource” nu spune ce resursă: adăugăm URL-ul, altfel eroarea nu poate fi nici diagnosticată, nici filtrată
      const url = msg.location().url;
      const text = url ? `${msg.text()} @ ${url}` : msg.text();
      if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
      errors.push(`[console] ${text}`);
    });
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
    await use(errors);
  },
});

export { expect };

/** Imagini încărcate efectiv dar cu naturalWidth 0 = imagini rupte. */
export async function brokenImages(page: Page): Promise<string[]> {
  await page.evaluate(async () => {
    // forțează lazy-load
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
  });
  // site-ul Next.js nu atinge niciodată „networkidle” (prefetch continuu): așteptăm să se termine imaginile vizibile în DOM
  await page.waitForLoadState('load');
  await page
    .waitForFunction(() => Array.from(document.images).every((img) => img.complete), undefined, { timeout: 8_000 })
    .catch(() => {});
  return page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0 && img.src)
      .map((img) => img.currentSrc || img.src),
  );
}
