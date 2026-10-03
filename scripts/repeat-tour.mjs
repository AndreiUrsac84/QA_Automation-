// Rulează turul prin pagini de TOUR_RUNS ori pentru fiecare motor de browser (chromium, firefox, webkit).
// Într-un ciclu motoarele rulează pe rând; ciclurile pornesc la TOUR_INTERVAL_MIN minute unul de altul.
// Config din .env: TOUR_RUNS (implicit 20), TOUR_INTERVAL_MIN (implicit 10), TOUR_BROWSERS (implicit toate trei).
// Oprire: Ctrl+C.
import { spawnSync } from 'node:child_process';

try {
  process.loadEnvFile('.env');
} catch {
  // fără .env se folosesc valorile implicite
}

const runs = Number(process.env.TOUR_RUNS ?? 20);
const intervalMs = Number(process.env.TOUR_INTERVAL_MIN ?? 10) * 60_000;
const browsers = (process.env.TOUR_BROWSERS ?? 'chromium,firefox,webkit').split(',').map((b) => b.trim());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toLocaleString('ro-RO');

const results = []; // { run, browser, ok, at }
for (let i = 1; i <= runs; i++) {
  const started = Date.now();
  console.log(`\n=== Ciclul ${i}/${runs} – ${stamp()} ===`);
  for (const browser of browsers) {
    console.log(`--- ${browser} ---`);
    const r = spawnSync('npx', ['playwright', 'test', `--project=tour-${browser}`, '--retries=0', '--workers=1'], {
      stdio: 'inherit',
      shell: true,
    });
    results.push({ run: i, browser, ok: r.status === 0, at: stamp() });
  }

  if (i < runs) {
    const wait = Math.max(0, intervalMs - (Date.now() - started));
    console.log(`Pauză până la următorul ciclu (${i + 1}/${runs}): ${Math.round(wait / 1000)}s – pornește la ${new Date(Date.now() + wait).toLocaleTimeString('ro-RO')}.`);
    // mesaj la fiecare minut, ca să se vadă că scriptul așteaptă și nu s-a oprit
    for (let left = wait; left > 0; left -= 60_000) {
      await sleep(Math.min(60_000, left));
      if (left > 60_000) console.log(`  … mai sunt ${Math.round((left - 60_000) / 60_000)} min până la ciclul ${i + 1}`);
    }
  }
}

console.log('\n=== Rezumat ===');
for (const browser of browsers) {
  const mine = results.filter((r) => r.browser === browser);
  console.log(`${browser}: ${mine.filter((r) => r.ok).length}/${mine.length} rulări reușite`);
}
const failed = results.filter((r) => !r.ok);
for (const f of failed) console.log(`  EȘUAT: ${f.browser}, ciclul ${f.run} (${f.at})`);
process.exit(failed.length ? 1 : 0);
