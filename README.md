# Yapin Music

Yapin Music is a lightweight music-guessing game with two modes: **Guess the Song** and **Guess the Band**. It supports daily and random rounds, three difficulty levels, hints, local progress, and team profiles.

This repository keeps the current browser game working while establishing a clean base for accounts, a shared leaderboard, and persistent player progress.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local development URL. To make a production build:

```bash
npm run build
npm run preview
```

Run the automated checks:

```bash
npm test
npm run check
```

## Project structure

```text
.
├── public/
│   └── assets/             # Logo, banner, and team avatars
├── src/
│   ├── data/
│   │   ├── music.js        # Band and song catalog
│   │   └── team.js         # Team roles and profile information
│   ├── js/
│   │   └── app.js          # App routing and game UI/controllers
│   ├── lib/
│   │   └── normalize.js    # Shared matching and text-normalization helpers
│   ├── services/
│   │   ├── storage.js      # Browser persistence adapter (localStorage today)
│   │   └── leaderboard.js  # Backend adapter boundary for a future leaderboard
│   └── styles.css
├── supabase/
│   └── migrations/         # Database schema foundation; not applied yet
├── tests/                  # Node test-runner tests
├── index.html
└── package.json
```

## Where to make changes

- Add or edit bands and songs in `src/data/music.js`.
- Change team names, roles, handles, or avatars in `src/data/team.js`.
- Update the game screens and rules in `src/js/app.js`.
- Keep reusable matching logic in `src/lib/normalize.js` and cover it with tests in `tests/`.
- Keep browser persistence behind `src/services/storage.js`. This avoids scattering `localStorage` calls throughout the game and gives us a clear place to add database sync later.
- Add future shared leaderboard implementations behind `src/services/leaderboard.js` rather than coupling database calls directly to the UI.

## Online music information

The Music Explorer connects to two public catalog services when a visitor submits a search:

- Wikipedia (MediaWiki Action API) for band and artist introductions, article links, and available images.
- Apple Music / iTunes Search API for song artwork, album, artist, release date, genre, duration, and Apple Music links.

Searches are manual rather than automatic while typing. Successful responses are cached in the visitor's browser for seven days. These lookups do not change game answers, daily selection, scores, or the local catalog. The feature degrades gracefully if a provider is unavailable. Apple documents an approximate limit of 20 Search API calls per minute, so avoid automated bulk lookups and keep the cache enabled.

## Current data and backend status

The current game is still **frontend-only**. Theme preference, difficulty preferences, daily-round state, and personal stats remain in the visitor's browser using `localStorage`. There is no account system, live database connection, or shared leaderboard enabled in this starter repository.

A first Supabase schema draft is included at `supabase/migrations/20261124000000_initial_schema.sql`. It lays out profiles, per-game scores, row-level security policies, indexes, and a leaderboard view. It is a starting point, not a production-ready anti-cheat system. Before enabling public rankings, score submission should be validated by a trusted server-side function or RPC; never trust a score sent directly by a browser client.

When the database is added:

1. Create a Supabase project and review/apply the migration.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to local and hosting environment settings.
3. Add sign-up/sign-in and profile management.
4. Implement a Supabase-backed leaderboard adapter in `src/services/leaderboard.js`.
5. Validate score calculations server-side, then connect the game result screens to score submission and leaderboard reads.

Only the Supabase anon/publishable key belongs in browser configuration. Never expose a service-role key in frontend code or `.env` values prefixed with `VITE_`.

## Development notes

- The original game rules, catalog, daily/random selection, and local stats are preserved.
- Third-party hosting-injection scripts from the original HTML export have been removed.
- Images previously embedded as large base64 strings have been moved into `public/assets/`.
- Keep commits focused and add tests when extracting new game logic.

## Suggested next milestones

1. Account creation and player profiles.
2. Cloud save / cross-device progress sync.
3. Verified score submission and global leaderboard filters (game mode, difficulty, daily/all-time).
4. Daily challenge history, streak tracking, and player statistics.
5. Admin tools for maintaining the music catalog and team profiles.
