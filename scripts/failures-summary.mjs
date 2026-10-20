// Rezumatul eșecurilor din test-results/results.json: ce teste au picat și cauza (prima linie a erorii).
// În GitHub Actions scrie și în rezumatul job-ului ($GITHUB_STEP_SUMMARY).
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'test-results/results.json';
if (!existsSync(file)) {
  console.log(`Nu există ${file} (testele nu au ajuns să ruleze).`);
  process.exit(0);
}

const report = JSON.parse(readFileSync(file, 'utf8'));
const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');

const failed = []; // { title, project, cause }
const flaky = [];
function walk(suite, path) {
  const here = suite.title && !suite.title.endsWith('.ts') ? [...path, suite.title] : path;
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const title = `${spec.file}:${spec.line} › ${[...here, spec.title].join(' › ')}`;
      if (test.status === 'flaky') flaky.push({ title, project: test.projectName });
      if (test.status !== 'unexpected') continue;
      const last = test.results.at(-1);
      const message = stripAnsi(last?.error?.message ?? last?.errors?.[0]?.message ?? `status: ${last?.status}`);
      const cause = message.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 3).join(' | ');
      failed.push({ title, project: test.projectName, cause });
    }
  }
  for (const child of suite.suites ?? []) walk(child, here);
}
for (const suite of report.suites ?? []) walk(suite, []);

const lines = [];
const s = report.stats ?? {};
lines.push(`## Rezultat E2E: ${s.expected ?? 0} trecute, ${failed.length} picate, ${flaky.length} instabile, ${s.skipped ?? 0} sărite`);
if (failed.length) {
  lines.push('', '### Teste picate', '', '| Test | Proiect | Cauza |', '|---|---|---|');
  for (const f of failed) lines.push(`| ${f.title} | ${f.project} | ${f.cause.replace(/\|/g, '\\|')} |`);
}
if (flaky.length) {
  lines.push('', '### Instabile (au trecut la reîncercare)', '');
  for (const f of flaky) lines.push(`- ${f.title} (${f.project})`);
}
const text = lines.join('\n');

console.log(`\n${text}`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
