---
description: Rulează testarea automată pentru dauron-trust.com și produce raport
argument-hint: "[smoke|full|visual|<fișier spec>]"
---

Folosește subagentul `qa-tester` pentru a testa https://dauron-trust.com.

Nivel cerut: `$ARGUMENTS` (implicit: `smoke`).

- `smoke` → `npm run test:smoke`
- `full` → `npm test`
- `visual` → `npm run test:visual`
- un nume de fișier → doar acel spec, pe desktop-chrome

Analizează eșecurile, repară doar testele fragile, nu masca bugurile site-ului, și întoarce raportul în formatul din agent.
