import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.119.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return jsonResponse({ error: "Sign in to submit a leaderboard result." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Leaderboard server configuration is incomplete." }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return jsonResponse({ error: "Your session is invalid. Sign in again." }, 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: "Invalid JSON body." }, 400); }

  const gameMode = body.game_mode;
  const difficulty = body.difficulty;
  const won = body.won;
  const guessesUsed = body.guesses_used;
  const puzzleDate = body.puzzle_date;

  if (gameMode !== "song" && gameMode !== "band") return jsonResponse({ error: "Invalid game mode." }, 400);
  if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") return jsonResponse({ error: "Invalid difficulty." }, 400);
  if (typeof won !== "boolean") return jsonResponse({ error: "Invalid result." }, 400);
  if (!Number.isInteger(guessesUsed) || Number(guessesUsed) < 0 || Number(guessesUsed) > (gameMode === "song" ? 12 : 9)) {
    return jsonResponse({ error: "Invalid number of guesses." }, 400);
  }
  if (typeof puzzleDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(puzzleDate)) {
    return jsonResponse({ error: "Invalid daily puzzle date." }, 400);
  }

  const suppliedDay = new Date(puzzleDate + "T00:00:00.000Z");
  if (Number.isNaN(suppliedDay.getTime())) return jsonResponse({ error: "Invalid daily puzzle date." }, 400);
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const suppliedUtc = Date.UTC(suppliedDay.getUTCFullYear(), suppliedDay.getUTCMonth(), suppliedDay.getUTCDate());
  const dayDistance = Math.abs(Math.round((todayUtc - suppliedUtc) / 86400000));
  if (dayDistance > 1) return jsonResponse({ error: "Only today's daily puzzle can be ranked." }, 400);

  // Points are determined here, never accepted from the browser.
  const pointsByDifficulty: Record<string, number> = { easy: 100, medium: 150, hard: 200 };
  const points = won ? pointsByDifficulty[difficulty] : 0;
  const { error: insertError } = await adminClient.from("game_scores").insert({
    user_id: authData.user.id,
    game_mode: gameMode,
    difficulty,
    score: points,
    won,
    guesses_used: guessesUsed,
    puzzle_date: puzzleDate
  });

  if (insertError) {
    if (insertError.code === "23505") return jsonResponse({ saved: true, duplicate: true });
    console.error("Could not save leaderboard result:", insertError.message);
    return jsonResponse({ error: "Could not save this result. Please try again." }, 500);
  }

  return jsonResponse({ saved: true, points });
});
