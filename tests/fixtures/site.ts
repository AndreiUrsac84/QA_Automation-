import { test as base, expect, type APIResponse, type Page } from '@playwright/test';
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
  { path: '/servicii/', name: 'Servicii', titleId: 'servicii-title', titleRe: /Servicii de proiectare.*DAURON TRUST/i },
  { path: '/portofoliu/', name: 'Portofoliu', titleId: 'portfolio-title', titleRe: /Portofoliu.*DAURON TRUST/i },
  { path: '/articole/', name: 'Articole', titleId: 'articole-title', titleRe: /Ghiduri despre construc.*DAURON TRUST/i },
  { path: '/contact/', name: 'Contact', titleId: 'contact-title', titleRe: /Contact.*DAURON TRUST/i },
  { path: '/gdpr/', name: 'GDPR', titleId: 'gdpr-title', titleRe: /Politica de confiden.*DAURON TRUST/i },
  // Pagina locală (SEO pe zonă), apărută în 2026-10; după GDPR, ca PAGES[0..5] să rămână aliniat cu NAV_ITEMS
  { path: '/proiectare-negresti/', name: 'Proiectare Negresti', titleId: 'local-title', titleRe: /Proiectare construc.ii Negre.ti.*DAURON TRUST/i },
  // Paginile serviciilor (/servicii/<slug>/), câte una per card din /servicii/
  { path: '/servicii/case-vile/', name: 'Serviciu Case și vile', titleId: 'servicii-case-vile-titlu', titleRe: /Case .i vile.*DAURON TRUST/i },
  { path: '/servicii/intrare-in-legalitate/', name: 'Serviciu Intrare în legalitate', titleId: 'servicii-intrare-in-legalitate-titlu', titleRe: /Intrare .n legalitate.*DAURON TRUST/i },
  { path: '/servicii/extinderi-mansardari/', name: 'Serviciu Extinderi mansardari', titleId: 'servicii-extinderi-mansardari-titlu', titleRe: /Extinderi, mans.*DAURON TRUST/i },
  { path: '/servicii/consolidari-reabilitari/', name: 'Serviciu Consolidari reabilitari', titleId: 'servicii-consolidari-reabilitari-titlu', titleRe: /Consolid.ri .i reabilit.*DAURON TRUST/i },
  { path: '/servicii/hale-industriale/', name: 'Serviciu Hale industriale', titleId: 'servicii-hale-industriale-titlu', titleRe: /Hale .i construc.ii industriale.*DAURON TRUST/i },
  { path: '/servicii/cladiri-publice-comerciale/', name: 'Serviciu Cladiri publice comerciale', titleId: 'servicii-cladiri-publice-comerciale-titlu', titleRe: /Cl.diri publice .i comerciale.*DAURON TRUST/i },
  { path: '/servicii/edilitare/', name: 'Serviciu Edilitare', titleId: 'servicii-edilitare-titlu', titleRe: /Proiecte edilitare.*DAURON TRUST/i },
  { path: '/servicii/anexe-garaje-garduri/', name: 'Serviciu Anexe garaje garduri', titleId: 'servicii-anexe-garaje-garduri-titlu', titleRe: /Anexe, garaje .i garduri.*DAURON TRUST/i },
  { path: '/servicii/obtinere-acte/', name: 'Serviciu Obtinere acte', titleId: 'servicii-obtinere-acte-titlu', titleRe: /Ob.inerea actelor.*DAURON TRUST/i },
  { path: '/servicii/asistenta-santier/', name: 'Serviciu Asistenta santier', titleId: 'servicii-asistenta-santier-titlu', titleRe: /Asisten.. tehnic. pe .antier.*DAURON TRUST/i },
  { path: '/servicii/colaborare-firme/', name: 'Serviciu Colaborare firme', titleId: 'servicii-colaborare-firme-titlu', titleRe: /Colaborare pentru firme.*DAURON TRUST/i },
  // Specialitățile (/specialitati/<slug>/), apărute în release-ul multilingv din 2026-10
  { path: '/specialitati/arhitectura/', name: 'Specialitate Arhitectura', titleId: 'specialitate-arhitectura-titlu', titleRe: /Arhitectur.*DAURON TRUST/i },
  { path: '/specialitati/edilitare/', name: 'Specialitate Edilitare', titleId: 'specialitate-edilitare-titlu', titleRe: /Proiecte edilitare.*DAURON TRUST/i },
  { path: '/specialitati/elemente-arhitecturale/', name: 'Specialitate Elemente arhitecturale', titleId: 'specialitate-elemente-arhitecturale-titlu', titleRe: /Elemente arhitecturale.*DAURON TRUST/i },
  { path: '/specialitati/geotehnic/', name: 'Specialitate Geotehnic', titleId: 'specialitate-geotehnic-titlu', titleRe: /Studii geotehnice.*DAURON TRUST/i },
  { path: '/specialitati/topografie/', name: 'Specialitate Topografie', titleId: 'specialitate-topografie-titlu', titleRe: /Topografie.*DAURON TRUST/i },
  { path: '/specialitati/instalatii/',name: 'Specialitate Instalatii', titleId: 'specialitate-instalatii-titlu', titleRe: /Instala.*DAURON TRUST/i },
  { path: '/specialitati/verificatori-experti/', name: 'Specialitate Verificatori experti', titleId: 'specialitate-verificatori-experti-titlu', titleRe: /Verificatori.*DAURON TRUST/i },
  // Subiectele din /articole/ (ghidurile grupate pe temă)
  { path: '/articole/subiect/construiesc-o-casa/', name: 'Subiect Construiesc o casa', titleId: 'subiect-construiesc-o-casa-title', titleRe: /construiesc o cas.*DAURON TRUST/i },
  { path: '/articole/subiect/constructie-fara-autorizatie/', name: 'Subiect Constructie fara autorizatie', titleId: 'subiect-constructie-fara-autorizatie-title', titleRe: /f.r. autoriza.*DAURON TRUST/i },
  { path: '/articole/subiect/ce-s-a-schimbat-in-lege/', name: 'Subiect Ce s-a schimbat in lege', titleId: 'subiect-ce-s-a-schimbat-in-lege-title', titleRe: /schimbat .n lege.*DAURON TRUST/i },
  { path: '/articole/subiect/reguli-pentru-zona-mea/', name: 'Subiect Reguli pentru zona mea', titleId: 'subiect-reguli-pentru-zona-mea-title', titleRe: /zona mea.*DAURON TRUST/i },
  { path: '/articole/subiect/siguranta-si-rezistenta/', name: 'Subiect Siguranta si rezistenta', titleId: 'subiect-siguranta-si-rezistenta-title', titleRe: /rezisten.*DAURON TRUST/i },
] as const;

/**
 * Paginile de categorie din portofoliu (/portofoliu/<slug>/). Nu intră în PAGES: smoke.spec.ts le verifică încărcarea
 * (în toate limbile), content.spec.ts că portofoliul are link spre fiecare.
 * Din 2026-10 o categorie e indexată doar dacă are proiecte: `indexed: true` = în sitemap și fără noindex (seo.spec.ts
 * o tratează ca pe o pagină din PAGES); `indexed: false` = `noindex, follow` și în afara sitemap-ului.
 * Când o categorie primește primul proiect, treci-o pe `indexed: true`.
 */
export const PORTFOLIO_CATEGORIES = [
  { path: '/portofoliu/locuinte/', name: 'Portofoliu Locuinte', titleId: 'portfolio-locuinte-title', titleRe: /Locuin.e .i reabilit.ri.*DAURON TRUST/i, indexed: true },
  { path: '/portofoliu/edilitare/', name: 'Portofoliu Edilitare', titleId: 'portfolio-edilitare-title', titleRe: /Proiecte edilitare: re.ele.*DAURON TRUST/i, indexed: true },
  { path: '/portofoliu/hale/', name: 'Portofoliu Hale', titleId: 'portfolio-hale-title', titleRe: /Hale industriale.*DAURON TRUST/i, indexed: true },
  { path: '/portofoliu/international/', name: 'Portofoliu International', titleId: 'portfolio-international-title', titleRe: /interna.ionale.*DAURON TRUST/i, indexed: true },
  { path: '/portofoliu/elemente-arhitecturale/', name: 'Portofoliu Elemente arhitecturale', titleId: 'portfolio-elemente-arhitecturale-title', titleRe: /Sc.ri, ornamente.*DAURON TRUST/i, indexed: false },
] as const;

/**
 * Limbile traduse ale site-ului: fiecare pagină și articol are și versiunea /<limbă>/<cale>/ (româna e fără prefix).
 * Traducerile nu se listează în PAGES; seo.spec.ts verifică pe ele lang, canonical și hreflang.
 */
export const LANGUAGES = ['en', 'it', 'es', 'de', 'hu'] as const;
const LANG_PREFIX = new RegExp(`^/(${LANGUAGES.join('|')})(?=/)`);

/** Calea în română a unei pagini traduse (/en/contact/ → /contact/) și limba ei; pentru o cale română, lang = 'ro'. */
export function splitLanguage(path: string): { lang: string; path: string } {
  const m = path.match(LANG_PREFIX);
  return m ? { lang: m[1], path: path.slice(m[0].length) } : { lang: 'ro', path };
}

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
  { label: 'Servicii', href: /\/servicii\/?$/ },
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
/**
 * Testare locală (beta în Docker, staging): site-ul conține și adrese absolute de producție – linkul de copyright din
 * footer, redirecturile /about/ și /portfolio/ din .htaccess. Ca testele locale să nu ajungă pe live, orice cerere spre
 * dauron-trust.com (navigare, click, redirect, request HTTP din test) e trimisă la ținta testată. Pe live nu se schimbă nimic.
 */
const LIVE_HOST = /^https?:\/\/(www\.)?dauron-trust\.com(?=[/?#]|$)/i;
const TARGET_ORIGIN = new URL(process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'https://dauron-trust.com').origin;
export const IS_LIVE_TARGET = LIVE_HOST.test(TARGET_ORIGIN);

/** Adresa de producție → aceeași cale pe ținta testată (pe live sau pentru alte adrese întoarce URL-ul neschimbat). */
export function toTarget(url: string): string {
  return IS_LIVE_TARGET ? url : url.replace(LIVE_HOST, TARGET_ORIGIN);
}

type RequestMethod = 'get' | 'head' | 'post' | 'put' | 'patch' | 'delete' | 'fetch';
const REQUEST_METHODS = new Set<string>(['get', 'head', 'post', 'put', 'patch', 'delete', 'fetch']);

/** Fixture-uri fără pauză după goto (folosite direct de tour.spec.ts, care are pauzele lui). */
export const baseTest = base.extend({
  context: async ({ context }, use) => {
    if (!IS_LIVE_TARGET) {
      // route.continue() nu poate schimba protocolul (https → http), deci cererea se face spre țintă și răspunsul se
      // întoarce browserului; redirecturile rămân la browser (maxRedirects: 0), iar următoarea cerere trece tot pe aici
      await context.route(LIVE_HOST, async (route) => {
        const response = await route.fetch({ url: toTarget(route.request().url()), maxRedirects: 0 }).catch(() => null);
        if (response) await route.fulfill({ response });
        else await route.abort();
      });
    }
    await use(context);
  },
  request: async ({ request }, use) => {
    if (IS_LIVE_TARGET) return use(request);
    // request.get('/x') rămâne relativ; adresele absolute de producție și redirecturile spre producție merg pe țintă
    const local = new Proxy(request, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof prop !== 'string' || !REQUEST_METHODS.has(prop)) return typeof value === 'function' ? value.bind(target) : value;
        const method = (value as (url: string, options?: object) => Promise<APIResponse>).bind(target);
        return async (url: string, options: { maxRedirects?: number } = {}) => {
          if (typeof url !== 'string') return method(url, options);
          const maxRedirects = options.maxRedirects ?? 20;
          let current = toTarget(url);
          for (let hop = 0; ; hop++) {
            const res = await method(current, { ...options, maxRedirects: 0 });
            const location = res.headers()['location'];
            const isRedirect = res.status() >= 300 && res.status() < 400 && location;
            if (!isRedirect || maxRedirects === 0 || hop >= maxRedirects) return res;
            current = toTarget(new URL(location, res.url()).href);
          }
        };
      },
    }) as typeof request & Record<RequestMethod, unknown>;
    await use(local);
  },
});

const withPagePause = baseTest.extend<{ page: Page }>({
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
