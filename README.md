# dauron-trust-e2e

Testare automată E2E pentru [dauron-trust.com](https://dauron-trust.com) (site de prezentare DAURON-TRUST SRL, proiectare structuri, Negrești, Vaslui) – Playwright + TypeScript + agent Claude Code.

## Instalare (o singură dată)

```
npm ci
npx playwright install chromium firefox
```

## Rulare

```
npm run test:smoke     # rapid
npm test               # complet
npm run report         # raport HTML
npm run test:visual    # regresie vizuală (separat)
npm run test:tour:once # tur lent prin pagini, o rulare per motor (npm run test:tour = repetat)
```

Configurare locală: copiază `.env.example` în `.env` (țintă `BASE_URL`, fallback local Docker `BASE_URL_FALLBACK`,
`HEADLESS`, `SLOW_MO`, `WORKERS`, parametrii turului). Formularul de contact NU se trimite real decât cu
`CONTACT_LIVE_SUBMIT=1`.

## Structură

- `tests/` – specuri (smoke, navigation, contact, seo, links, content, a11y-responsive, visual, tour); `tests/fixtures/site.ts` = lista paginilor
- `Pages/` – Page Objects; `Pages/LocatorsPage/` – locatorii după id
- `scripts/repeat-tour.mjs` – repetă turul
- `.claude/` – agentul `qa-tester`, comanda `/test-site`, permisiuni

## Cu Claude Code

Deschide folderul în Claude Code și scrie:

```
/test-site smoke
/test-site full
/test-site visual
```

sau „folosește qa-tester să verifice pagina de contact”.

Agentul: `.claude/agents/qa-tester.md`. Reguli proiect: `CLAUDE.md`.
Rulare în cloud (de 3 ori pe zi, la push pe master și manual): `.github/workflows/e2e.yml` (repo GitHub + opțional secret `ANTHROPIC_API_KEY`
și variabila `CLAUDE_TRIAGE=true` pentru analiză automată a eșecurilor).
