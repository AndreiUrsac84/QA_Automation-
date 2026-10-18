# Instrucțiuni pentru agenți – dauron-trust-e2e

Document pentru agenți AI (Claude Code, `qa-tester`, GitHub Actions) care lucrează în acest repository.
Regulile de bază sunt în [CLAUDE.md](CLAUDE.md); aici sunt procedurile pas cu pas. Dacă ceva se contrazice,
`CLAUDE.md` și secțiunea **Linii roșii** de mai jos câștigă.

Limba: **română** – comentarii, mesaje de assert, commit-uri, rapoarte.

## 1. Context

- Țintă: https://dauron-trust.com (site de prezentare DAURON-TRUST SRL, birou de proiectare structuri).
- Stack: Playwright + TypeScript + axe-core. Fără cod de aplicație – repo-ul conține doar teste.
- Mediul se schimbă cu `BASE_URL` (implicit producție).

## 2. Agenți și puncte de intrare

| Ce | Unde | Rol |
|---|---|---|
| Agent `qa-tester` | `.claude/agents/qa-tester.md` | Rulează suita, clasifică eșecurile, repară teste fragile, scrie teste noi, raportează |
| Comanda `/test-site` | `.claude/commands/test-site.md` | Pornește `qa-tester` cu nivel: `smoke` (implicit), `full`, `visual` sau un fișier spec |
| Permisiuni | `.claude/settings.json` | Allowlist pentru npm/playwright; **deny** pentru submit live și update de snapshot-uri |
| CI | `.github/workflows/e2e.yml` | Rulare de 3 ori pe zi + manuală + push pe master (https://dauron-trust.com); opțional triage automat cu Claude |

Când să folosești ce:
- „testează site-ul”, după o modificare a site-ului → `/test-site smoke` sau `qa-tester`.
- Verificare înainte de release → `/test-site full`.
- Schimbare de design voită → cere acord utilizatorului pentru `test:visual:update` (vezi §6).

## 3. Pornire rapidă

```bash
npm ci
npx playwright install chromium firefox webkit   # doar dacă lipsesc browserele
npm run typecheck
npm run test:smoke                               # ~1 min
```

| Nevoie | Comandă |
|---|---|
| Rapid | `npm run test:smoke` |
| Complet | `npm test` |
| Un fișier | `npx playwright test tests/<fișier>.spec.ts --project=desktop-chrome` |
| Un test | `npx playwright test -g "<nume>" --project=desktop-chrome --retries=0` |
| Stabilitate | adaugă `--repeat-each=3` |
| Vizual | `npm run test:visual` |
| Alt mediu | `BASE_URL=https://staging.dauron-trust.com npm test` |
| Raport | `npm run report`; brut: `test-results/results.json` |
| Trace | `npx playwright show-trace <zip>` |

## 4. Procedura la un test picat

1. Citește eroarea din `test-results/results.json` (și `error-context.md` din folderul testului).
2. Reproduce izolat (`-g ... --retries=0`).
3. Verifică starea reală a paginii (WebFetch pe dauron-trust.com sau un script Playwright scurt).
4. Clasifică și acționează:

| Clasă | Semn | Acțiune |
|---|---|---|
| **BUG SITE** | Pagina e greșită față de așteptarea rezonabilă (link rupt, imagine lipsă, H1 duplicat, eroare JS) | **Nu modifica testul.** Raportează: pagină, pași, așteptat vs. obținut, severitate |
| **TEST FRAGIL** | Site-ul e corect, locatorul/așteptarea e greșită | Repară cu `getByRole`/`getByLabel`/`getByText` și auto-wait; rulează `--repeat-each=3` |
| **SCHIMBARE VOITĂ** | Text nou, pagină nouă, meniu schimbat | Actualizează `tests/fixtures/site.ts` sau testul + comentariu despre ce s-a schimbat |
| **INSTABIL** | Rețea, terți (analytics, linkuri externe) | Re-rulează; dacă persistă, notează-l în raport, nu-l ascunde |

Dacă nu ești sigur între BUG SITE și SCHIMBARE VOITĂ, **tratează-l ca bug și întreabă utilizatorul**.

## 5. Cum adaugi acoperire

**Pagină nouă pe site** → adaug-o întâi în `PAGES` (și în `NAV_ITEMS` dacă e în meniu) din
`tests/fixtures/site.ts`. Majoritatea testelor (smoke, SEO, a11y) iterează pe acea listă și o vor acoperi automat.

**Test nou** – în fișierul tematic potrivit:

| Fișier | Conținut |
|---|---|
| `smoke.spec.ts` | status HTTP, title, H1, logo, imagini rupte, erori JS, HTTPS, 404, timp încărcare |
| `navigation.spec.ts` | meniu, footer, CTA, logo |
| `contact.spec.ts` | date contact, formular (validări, GDPR, submit **mock**) |
| `seo.spec.ts` | meta, OG, H1 unic, canonical, lang, robots, sitemap |
| `links.spec.ts` | crawler linkuri interne și externe |
| `content.spec.ts` | articole, portofoliu, home |
| `a11y-responsive.spec.ts` | axe WCAG 2.1 AA, overflow orizontal, ținte touch |
| `visual.spec.ts` | regresie vizuală |

Convenții:
- Importă `test`/`expect` din `./fixtures/site` (nu direct din `@playwright/test`), ca să ai `consoleErrors`.
- Locatori: `getByRole` > `getByLabel` > `getByText`. Fără selectori CSS fragili, fără `nth-child`.
- Fără `waitForTimeout` (excepție: cele existente la validarea formularului). Folosește auto-wait și `expect(...).toBe...`.
- Mesaje de assert în română și descriptive.
- Taguri: `@smoke` doar pentru teste rapide și esențiale (rulează și pe Firefox și Safari mobil).
- `test.skip`/`fixme` doar cu motiv scris în cod.

După **orice** modificare de cod: `npm run typecheck`, apoi rulează testele atinse.

## 6. Linii roșii

1. **Nu trimite formularul de contact real.** Testele interceptează POST-urile. `CONTACT_LIVE_SUBMIT=1` doar la cerere explicită a utilizatorului (e și în deny-list).
2. **Nu rula `--update-snapshots` / `test:visual:update`** fără acord explicit. Dacă lipsesc referințele vizuale, anunță – nu le genera.
3. **Nu masca buguri**: nu slăbi aserțiuni, nu crește praguri, nu folosi `expect.soft`/`skip` ca să treacă suita.
4. Nu modifica fișiere în afara acestui proiect.
5. Nu face spam pe site: crawler-ul de linkuri e deja limitat; nu adăuga bucle de cereri masive.
6. Nu pune secrete în repo (`.env` e ignorat). `ANTHROPIC_API_KEY` stă doar în GitHub Secrets.

## 7. Raportul final

Scurt, în română, fără umplutură:

```
## Raport testare dauron-trust.com – <dată>
Rulare: <comandă> | <N> trecute / <M> picate / <K> sărite | durată

### Buguri pe site
| # | Severitate | Pagină | Problemă | Pași / dovadă |

### Teste reparate / actualizate
- <fișier>: <ce și de ce>

### Observații (non-blocante)
- SEO / accesibilitate / performanță: ...

### Recomandări
```

Raportează fidel: dacă ceva a picat sau nu a fost rulat, spune-o explicit, cu ieșirea relevantă.

## 8. Git

- Commit-uri mici, în română, cu mesaj ce explică **de ce**.
- Nu comita `node_modules/`, `test-results/`, `playwright-report/`, `.env`, loguri (`run.log`, `install.log`).
- Nu face `push --force`, nu rescrie istoricul și nu împinge fără cererea utilizatorului.
- Fișiere de referință vizuală: se comit doar după ce utilizatorul a confirmat schimbarea.

## 9. CI (GitHub Actions)

- Declanșatori: cron 04:17, 10:17 și 16:17 UTC, manual (`workflow_dispatch`, input `suite`: `smoke`|`full`|`tour`) și push pe `master`.
- Rulează `typecheck`, apoi testele; încarcă `playwright-report/` și `test-results/` ca artefacte (14 zile).
- Job-ul `claude-triage` pornește doar la eșec și dacă variabila `CLAUDE_TRIAGE=true`; necesită secretul `ANTHROPIC_API_KEY`.
  Deschide **issue** pentru buguri de site și **PR** pentru teste fragile – aceleași reguli ca la §4 și §6.

## 10. Probleme frecvente

| Simptom | Cauză probabilă | Ce faci |
|---|---|---|
| Browser lipsă | Playwright neinstalat | `npx playwright install chromium firefox webkit` |
| Timeout general | Site lent sau rețea | Re-rulează cu `--retries=0` izolat; clasifică INSTABIL dacă e sporadic |
| Eșec doar pe linkuri externe | Terț indisponibil / blochează boți | INSTABIL; notează în raport |
| Diferențe vizuale | Schimbare de design sau randare diferită pe OS | Întreabă utilizatorul; nu actualiza singur |
| `typecheck` pică | Tip/import greșit în fișierul modificat | Repară înainte de a rula testele |
