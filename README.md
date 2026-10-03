# dauron-trust-e2e

Testare automată E2E pentru https://dauron-trust.com – Playwright + TypeScript + agent Claude Code.

## Instalare (o singură dată)

```
npm ci
npx playwright install chromium firefox webkit
```

## Rulare

```
npm run test:smoke     # rapid
npm test               # complet
npm run report         # raport HTML
```

## Cu Claude Code

Deschide folderul în Claude Code și scrie:

```
/test-site smoke
/test-site full
```

sau „folosește qa-tester să verifice pagina de contact”.

Agentul: `.claude/agents/qa-tester.md`. Reguli proiect: `CLAUDE.md`.
Rulare zilnică în cloud: `.github/workflows/e2e.yml` (repo GitHub + opțional secret `ANTHROPIC_API_KEY`
și variabila `CLAUDE_TRIAGE=true` pentru analiză automată a eșecurilor).
