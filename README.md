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

## Accounts, leaderboard, and ranks

Gameplay remains open to guests. An account is optional and is only needed when a player wants a public name on the shared leaderboard. Email/password sign-up and sign-in are handled by Supabase Auth; the public profile contains only the chosen username.

Only **Daily** rounds contribute ranked results. A win awards 100 points on Easy, 150 on Medium, or 200 on Hard. Random rounds remain practice-only. A player can submit one result per game mode, difficulty, and daily puzzle date. The server calculates fixed point values and browser clients cannot insert or edit score rows directly. The win/loss outcome is still reported by the browser, so treat this as a casual community leaderboard rather than a tamper-proof competitive ranking system. Results are queued locally so a player can finish a Daily round as a guest, sign in later, and then publish that result.

Ranks are based on total points: Rookie Listener (0), Bronze Listener (300), Silver Listener (750), Gold Listener (1,500), Platinum Listener (2,500), Diamond Listener (4,000), and Legend (6,000).

### Connect the backend

The repository includes the migration at `supabase/migrations/20261124000000_initial_schema.sql` and the authenticated score function at `supabase/functions/submit-score/index.ts`. They must be applied/deployed to a **dedicated YapinMusic Supabase project**; do not reuse a project belonging to another app.

1. Create a Supabase project, then run the SQL migration in its SQL Editor (or apply it with the Supabase CLI).
2. Deploy the Edge Function: `supabase functions deploy submit-score`. Keep JWT verification enabled.
3. In Vercel project settings, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project's URL and public anon/publishable key. The service-role key must never be exposed to the browser.
4. Redeploy the Vercel site after setting the environment variables.

Without those backend steps, the site continues to work as a guest game and shows that the shared leaderboard is not connected yet.

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
