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

The shared leaderboard and authentication are powered by a dedicated Neon project. Players can play every round as guests. An account is optional and is only needed to publish a public player name.

Only Daily rounds count towards ranked points: Easy wins = 100, Medium wins = 150, and Hard wins = 200. Random rounds stay unranked. Each user can submit one result per game mode, difficulty, and daily puzzle date. Points are calculated on the server and requests are authenticated with Neon Managed Better Auth. The current game still reports the win/loss outcome from the browser, so treat this as a casual community leaderboard rather than a tamper-proof competitive ranking system. Guest Daily results are queued locally and can be uploaded after the player signs in.

Ranks are based on total points: Rookie Listener (0), Bronze Listener (300), Silver Listener (750), Gold Listener (1,500), Platinum Listener (2,500), Diamond Listener (4,000), and Legend (6,000).

### Neon project

- Project: `yapinmusic`
- Region: `aws-ap-southeast-1` (Singapore)
- Database: `yapinmusic`
- Authentication: Neon Managed Better Auth (email/password)
- Schema migration: `neon/migrations/20261127000000_leaderboard.sql`

The Neon database stores public player names and daily scores. User identity and sessions are managed by Neon Auth. The database connection string is server-only and is used by Vercel API routes, never shipped to browser code.

### Environment variables

Set these in Vercel for Production, Preview, and Development:

- `VITE_NEON_AUTH_URL`: the public Neon Auth base URL used by the browser client
- `NEON_AUTH_BASE_URL`: the same Auth URL, used server-side to verify tokens with Neon JWKS
- `DATABASE_URL`: the pooled Neon Postgres connection string, server-only

For local development, copy `.env.example` to `.env.local` and fill in `DATABASE_URL`. Do not commit database credentials.

### API routes

- `GET /api/leaderboard`: public read of ranked players
- `GET /api/profile`: authenticated player card
- `POST /api/profile`: create or update the public player name
- `POST /api/submit-score`: verifies the Neon Auth JWT and records one Daily result


## Yapin verification

Players can optionally link a Yapin account from **Profile → Yapin verification**. Yapin Music requests only the `identify` scope and shows the verified badge on the player's public profile and leaderboard after Yapin confirms the identity. Linking does not replace the existing Neon Auth account.

The OAuth callback must be registered with Yapin as `https://yapinmusic.vercel.app/`. The implementation uses Authorization Code with S256 PKCE and a short-lived, single-use server-side state record. Yapin access tokens are used only to retrieve the identity and are not stored. The database migration is `neon/migrations/20261128000000_yapin_login.sql`.

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
