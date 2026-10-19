# dauron-trust-e2e

Suită de testare automată E2E pentru https://dauron-trust.com (site de prezentare DAURON-TRUST SRL,
birou de proiectare structuri, Negrești, jud. Vaslui). Stack: Playwright + TypeScript, axe-core.

Limba: română, în comentarii, mesaje de assert și rapoarte.

## Structură

- `playwright.config.ts` – baseURL (`BASE_URL` env, implicit producție), proiecte: desktop-chrome, mobile-chrome,
  desktop-firefox (@smoke), mobile-safari (@smoke), tour-chromium/firefox/webkit, visual-desktop, visual-mobile.
  Reîncercări: 1 local, 2 în CI. Variabilele de mediu sunt documentate în `.env.example` (`.env` e încărcat automat).
- `tests/fixtures/site.ts` – lista de pagini (`PAGES`), meniu (`NAV_ITEMS`), date contact, fixture `consoleErrors`,
  helper `brokenImages`. **Orice pagină nouă de pe site se adaugă întâi aici** (cu `titleId`, id-ul titlului);
  testul „acoperire” din `seo.spec.ts` pică dacă sitemap-ul are pagini care lipsesc din `PAGES`.
- `Pages/` – Page Objects, câte unul per pagină; `Pages/LocatorsPage/` – locatorii după id. Specurile le folosesc.
- `BASE_URL` = adresa principală (producție); `BASE_URL_FALLBACK` (ex. Docker local `http://localhost:8080`) se folosește
  doar dacă principala nu răspunde.
- `tests/tour.spec.ts` – tur cu derulare lentă prin pagini și articole (proiecte `tour-*`, rulare separată;
  `scripts/repeat-tour.mjs` îl repetă de `TOUR_RUNS` ori la `TOUR_INTERVAL_MIN` minute)
- `tests/smoke.spec.ts` – status HTTP, title, H1, logo, imagini rupte, erori JS, redirect HTTPS, 404, timp încărcare
- `tests/navigation.spec.ts` – meniu, footer, CTA-uri, logo
- `tests/contact.spec.ts` – date contact + formular (validări, GDPR, submit **mock**)
- `tests/seo.spec.ts` – meta, OG, H1 unic, canonical, lang, robots.txt, sitemap.xml
- `tests/links.spec.ts` – crawler linkuri rupte (interne + externe)
- `tests/content.spec.ts` – articole (fiecare deschis și verificat), portofoliu, home. Site-ul are 6 pagini principale,
  6 specialități (`/specialitati/<slug>/`), 5 subiecte (`/articole/subiect/<slug>/`) – toate 17 în `PAGES` – și ~28 de
  articole (`/articole/<slug>/`). Articolele NU se listează în `PAGES`: `/articole/` arată doar o parte, restul sunt pe
  paginile de subiect (`ArticolePage.articleUrls()` le adună de pe toate). Din 2026-10 site-ul e multilingv: fiecare
  pagină are și `/<limbă>/<cale>/` (`LANGUAGES` = en, it, es, de, hu; ~270 URL-uri în sitemap); traducerile nu intră în
  `PAGES`, `seo.spec.ts` le verifică lang, canonical și hreflang.
- `tests/a11y-responsive.spec.ts` – axe WCAG 2.1 AA, overflow orizontal, ținte touch
- `tests/visual.spec.ts` – regresie vizuală (rulare separată)

## Comenzi

```
npm test                    # toate proiectele funcționale
npm run test:smoke          # doar @smoke (rapid, ~1 min)
npm run test:desktop        # doar desktop-chrome
npm run test:visual         # regresie vizuală
npm run test:tour:once      # tur lent, o singură rulare pe motor (rulare repetată: npm run test:tour)
npm run typecheck           # tsc --noEmit
npm run test:visual:update  # regenerează referințele vizuale (doar după confirmare că schimbarea e voită)
npx playwright test tests/contact.spec.ts --project=desktop-chrome   # un singur fișier
BASE_URL=https://staging.dauron-trust.com npm test                   # alt mediu
npm run report              # deschide raportul HTML
npm run test:ci             # setul CI: Smoke + SEO + Search pe paginile principale și toate articolele
npm run test:extern         # linkurile externe (@extern), separat: depind de terți
```

Setul CI (`test:ci`) = `smoke.spec.ts` + `seo.spec.ts` + `search.spec.ts`. Articolele (`ARTICLES` din
`fixtures/site.ts`) se citesc din sitemap la colectarea testelor, deci fiecare articol are testele lui.

Variabile utile: `HEADLESS=true`, `SLOW_MO=<ms>`, `WORKERS=<n>`, `PAGE_PAUSE_MS=0` (fără pauza de 1s după `goto`),
`CRAWL_MAX_PAGES` (limită crawler linkuri). În CI (`.github/workflows/e2e.yml`) rulează `npm test` de 3 ori pe zi,
la push pe master și manual (`suite`: full | smoke | tour); opțional triage automat cu Claude (`CLAUDE_TRIAGE=true`).

Rezultatele brute: `test-results/results.json`. Trace-uri la eșec: `npx playwright show-trace <zip>`.

## Reguli

1. **Nu trimite niciodată formularul de contact real.** Testele interceptează POST-urile. Testul live rulează doar cu
   `CONTACT_LIVE_SUBMIT=1`, și doar dacă utilizatorul cere explicit.
2. Nu rula `--update-snapshots` fără acordul utilizatorului: șterge exact regresiile pe care testul trebuie să le prindă.
3. Când un test pică, decide dacă e **bug pe site** sau **test fragil / site schimbat voit**:
   - bug pe site → nu modifica testul ca să treacă; raportează-l.
   - site schimbat voit (text nou, pagină nouă) → actualizează `fixtures/site.ts` sau locatorul, explică de ce.
4. Locatori: **întâi id-ul** (`getByTestId`, configurat pe atributul `id`; locatorii sunt în `Pages/LocatorsPage/`,
   verificările pe pagini în `Pages/`). Doar dacă elementul nu are id: `getByRole`, `getByLabel`, `getByText`.
   Fără selectori CSS fragili sau `nth-child`.
   Fără `waitForTimeout` în afară de cazurile deja existente pentru validarea formularului.
5. Nu dezactiva teste (`test.skip`/`fixme`) fără motiv scris în cod.
6. Rulează `npm run typecheck` după orice modificare de cod.
