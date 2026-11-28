# Architecture notes

## Current browser flow

- `index.html` owns the application shell and navigation targets.
- `src/js/app.js` owns hash routing, theme behavior, rendering, and the two game controllers.
- `src/data/music.js` and `src/data/team.js` are content-only modules. They should not depend on browser APIs.
- `src/lib/normalize.js` contains reusable text matching functions and is covered by Node tests.
- `src/services/storage.js` is the only persistence boundary used by the current app. Existing `yapin:*` localStorage keys are preserved so visitors keep their saved theme, preferences, daily rounds, and stats.

## Future backend flow

The intended direction is to keep UI/game controllers independent of the database provider. The leaderboard UI should call `src/services/leaderboard.js`; a provider adapter can then use Supabase or another backend. Authentication should expose a small session/profile service rather than scattering auth calls through the game code.

The Supabase migration is only a proposed starting data model. Before public score submission is enabled, calculate/validate scores in a trusted server-side function, enforce one valid submission per daily puzzle where appropriate, and review RLS policies against the final product requirements.


## Community decorations and presence

- User-created avatar decorations are stored with their moderation state in `public.player_decorations`; only approved designs are returned in the public gallery or accepted by the wear action.
- Admin APIs validate the authenticated user ID against the server-only `YAPIN_ADMIN_USER_IDS` allowlist. Do not add this variable to browser-exposed `VITE_*` configuration.
- Signed-in clients heartbeat to `public.player_presence`; the admin dashboard counts as online accounts seen within the last five minutes.
- Run `neon/migrations/20261128020000_community_decorations.sql` before deploying the API/UI changes.
