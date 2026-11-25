# COOKING-BUILD — Saffron Rush (best-cooking-game-20261125-0137)

**Built:** 25 Nov 2026, ~14:06–15:15 WIB. **Status: BUILD ONLY — no push, no submit.**
**Dir:** `~/workspace/makefun/cooking-game/` (local commit, see bottom).
**Kit:** `~/workspace/makefun/best-cooking-game-20261125-0137-kit/` (RULES.txt read in full).

## The game

**Saffron Rush** — a 2D top-down kitchen game, vanilla JavaScript on canvas,
no libraries, no image or audio files. All art is drawn in code (canvas
vector shapes); all sound is synthesized with WebAudio.

One chef, one dinner service of 180 seconds. Tickets arrive on the rail with a
recipe and a patience bar. The loop: take an ingredient from a crate → chop
vegetables on a board (hold E, 1.2s) → grill the patty (6s to cooked, 10s to
burnt, with smoke and a warning) → build the plate on the assembly table →
serve it at the pass before patience runs out. Correct serves pay coins plus
a tip for remaining patience and build a combo (up to x4+); a wrong dish costs
patience on the oldest ticket and breaks the combo; an expired ticket is lost.

- 6 ingredients: bun, patty, tomato, lettuce, cheese, onion
- 5 recipes: Classic Stack, Cheese Melt, Garden Fresh, Saffron Special, Little Onion
- Controls: WASD / arrows to move (or click to walk), E / Space to interact
  (hold E to chop), R to restart, M to mute
- HUD: big timer, score, coins, combo badge, day. Title screen + game-over
  screen with stats and restart.

## Files

| File | Size | Note |
|---|---|---|
| `game/` (10 files) | 59,846 B | index.html + 9 single-purpose src modules |
| `screenshots/` (4 JPG) | 291,681 B total | 1280×800 each, 54–82 KB (cap 256 KiB) |
| `main.ts` | 1,705 B | own code, stdlib only, copies + buildDossier |
| `vendor/makefun-game.ts` | 56,282 B | kit copy, unchanged |
| `LICENSE` / `README.md` | MIT / game manual | |
| `.makefun/owner.json` | 57 B | wallet 5xVQ2… |

## Screenshots (all real renders of the game code, deterministic stages)

- **1-cover.jpg** — full kitchen mid-rush: 3 tickets on the rail, chef at the
  grills carrying a cooked patty, chopped tomato on a board, a half-built plate
  (bun + patty + lettuce) on the build table, a finished plate on the pass,
  timer 01:32, score 1240, coins 86, combo x3. All five judge-criterion-1
  elements visible: kitchen, order board, ingredients on the counter, a dish
  mid-assembly, a timer, a plate ready to serve.
- **2-orders.jpg** — close-up of the ticket rail (4 tickets, #2 Cheese Melt
  urgent with a red border and low patience bar) + chopping board with an
  onion + chef carrying a chopped tomato toward the build table.
- **3-rush.jpg** — service rush zoomed on the grills: one patty READY, one
  BURNT with smoke, two tickets at 8–12% patience (red, urgent), timer 00:24
  in red, hint bar "A patty burned! Trash it."
- **4-serve.jpg** — serving at the pass: chef beside the SERVE window, "+32
  coins" and "COMBO x4" popups, bell and sparkles on the pass, 2 tickets,
  timer 01:05, score 1580, combo x4.

## Verification results

- **Self-test `?selftest=1` (headless Chrome): 16 checks, 0 FAIL** — service
  starts, first order spawns, crate → chop → grill → build → serve completes
  an order (coins + combo), wrong dish refused, trash works, service ends at
  180s with a positive score. Two bugs found and fixed during the test: crates
  handed choppable items as 'ready' instead of 'raw' (chop never started);
  the test itself forgot to empty the chef's hands before the grill leg.
- **Screenshots:** re-rendered twice from the same staged states; each of the
  four viewed at full resolution by the builder. Fixes made after viewing:
  camera now zooms by width (orders/rush/serve are real close-ups, not the
  full frame), popups draw in screen space (they no longer blow up over the
  SERVE sign at high zoom), grill labels dark brown (were unreadable white on
  the floor), decorative prep counter + plant fill the lower kitchen, the
  counter and plant are collision solids so the chef cannot walk through them.
- **main.ts 2×:** run to two different directories with `MAKEFUN_OUTPUT_DIR` —
  outputs byte-identical (`diff -r` clean); dossier.json sha256
  `f1e6cc0a4741f54a61ca9a9a034bd2dcd668e398b8c5b04968e460112fade371`.
- **Gates:** game/ 10 files / 59,846 B (cap 993 / 48 MiB); screenshots 4 ×
  1280×800, each ≤ 256 KiB; dossier.json 451,955 B (cap 1.5 MiB); `makefun
  check` on the repo: see parent verification (transcripts_present fails
  without a bundle, as expected — the bundle is made at submit time).
- **No console errors** observed in the headless runs (self-test and
  screenshot renders both completed; the only stderr lines are Chrome's
  harmless D-Bus warnings).

## Notes / deviations

1. **No live recording for this bounty** (the CLI's record endpoint refuses
   with HTTP 400): transcripts are uploaded as a bundle at submit time, like
   the token-radar entries. All game code was written in this session; the
   starter was read only as a layout reference and none of its code was
   copied. `vendor/makefun-game.ts` is the kit copy, unchanged, as required.
2. The Feed peek (top entries' covers) was skipped: the bounty page loads its
   Feed dynamically and the artifact URLs were not in the static HTML; the
   design follows the GTA lesson instead (dense, colourful, readable cover
   with every criterion-1 element visible).
3. `world.js` originally had a dead `requireChop` stub; replaced with a real
   `updateChopping` import from `stations.js` before the first test run.
4. `updateStations`/`updateChopping` use `Math.random()` for particle
   spawns during live play only; screenshot mode renders one frozen frame
   with no updates, so staged shots are deterministic.

## Local commit

`git init` + commit in `~/workspace/makefun/cooking-game/` (commit hash
recorded in the parent's report; see `git log` in that directory).
