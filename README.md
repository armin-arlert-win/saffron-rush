# Saffron Rush

A fast 2D top-down kitchen game for the make.fun "Make the best cooking game"
bounty. Vanilla JavaScript on canvas — no libraries, no image or audio files:
all art is drawn in code and all sound is synthesized with WebAudio.

## The game

One chef, one dinner service of 180 seconds. Tickets arrive on the rail with a
recipe and a patience bar. Fetch ingredients from the crates, chop the
vegetables on a board (hold E), grill the patty (6 seconds to cooked, 10 to
burnt), build the plate on the assembly table, and serve it at the pass before
patience runs out. Correct serves earn coins plus a tip for remaining patience
and build a combo; wrong dishes and expired tickets break it.

Recipes: Classic Stack, Cheese Melt, Garden Fresh, Saffron Special, Little
Onion. Six ingredients: bun, patty, tomato, lettuce, cheese, onion.

## Controls

- **WASD / arrow keys** — move the chef (or click to walk to a point)
- **E / Space** — grab, place, pick up, serve (hold E to chop)
- **R** — restart after service ends
- **M** — mute

## Run it

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome, e.g. `python3 -m http.server` from `game/` — or run the kit's
`serve.ts`. Screenshots are deterministic stages of the same code
(`game/src/shots.js`, `?shot=cover|orders|rush|serve`); the headless
self-test runs at `?selftest=1` and prints PASS/FAIL lines.

## Layout

- `game/src/config.js` — constants, palette, recipes, station layout
- `game/src/world.js` — game state, chef movement, service clock
- `game/src/orders.js` — ticket rail, patience, serving and combos
- `game/src/stations.js` — crates, chopping, grilling, assembly, serve, trash
- `game/src/render.js` — all canvas drawing, HUD, ticket rail, overlays
- `game/src/shots.js` — deterministic staged states for the screenshots
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized WebAudio effects
- `game/src/main.js` — game loop, screenshot mode, self-test
