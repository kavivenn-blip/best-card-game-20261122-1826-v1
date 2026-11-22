// Monsoon Market — entrypoint: hand the game in.
// Copies game/ and screenshots/ beside this file to /output (or
// MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with the vendored make.fun library, exactly as the bounty asks.

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// G15: set mode berkas secara eksplisit. Umask lingkungan di sini 0007,
// sehingga salinan keluar 660/770 tanpa ini; juri/grader butuh file 0644
// dan folder 0755 di sandbox mana pun, jadi tetapkan lewat chmodSync.
function chmodTree(dir: string): void {
  chmodSync(dir, 0o755);
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      chmodTree(p);
    } else {
      chmodSync(p, 0o644);
    }
  }
}
chmodTree(out);
