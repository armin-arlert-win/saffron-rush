// main.ts — Saffron Rush hand-in (Node 22, standard library only).
//
// The game is the plain static files in this directory's game/ folder: a
// desktop browser opens game/index.html and plays offline, no build step and
// no network request. This program hands the game in: it copies game/ and
// screenshots/ from beside this file into /output and writes
// /output/dossier.json, the summary the judge reads, using the vendored
// make.fun library. Run it twice and the output is byte-identical.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, from the kit's gate: at most 4 screenshots and none
// over 256 KiB; game/ at most 993 files and 48 MiB in all; the dossier text
// capped at 160 KiB. The library enforces them while writing the dossier.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyEntry(name) {
  const src = join(repoRoot, name);
  if (!existsSync(src)) return;
  cpSync(src, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyEntry('game');
copyEntry('screenshots');

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_LIMITS));
