import { BANDS } from '../data/music.js';
import { TEAM } from '../data/team.js';
import { searchBandInfo, searchSongInfo } from '../services/music-info.js';
import { storage as ls } from '../services/storage.js';
import {
  getAccountState, subscribeAccount, signUp, signIn, signOut, saveUsername, saveProfileDetails,
  getLeaderboard, getPublicProfile, getPlayerLeaderboardEntry, wearCommunityDecoration, rankFor, submitScore, isLeaderboardConfigured,
  getDailyTasks, claimDailyReward, startYapinLogin, completeYapinLogin
} from '../services/leaderboard.js';
import { compressMediaFile, formatMediaBytes } from '../mediaCompressor.js';
import { key, bandKey, sortLetter, lookup } from '../lib/normalize.js';
import { createDecorationsUI, createAdminUI, initPresenceAndAdminLink } from '../decorations.js';

(function () {
  'use strict';
  var ICON = '/assets/brand-icon.webp';

  /* ============ EASY TO EDIT: TEAM ============ */
  // Replace names and handles. For a custom photo add avatar: "data:image/..." to a member.
  /* Music catalog is imported from src/data/music.js. */

  /* ============ HELPERS ============ */

  var NEED = 3;
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safeProfileColor(value) { var color = String(value || '').trim(); return /^#[0-9a-f]{6}$/i.test(color) ? color : '#FF6B35'; }
  function safeProfileChoice(value, choices, fallback) { return choices.indexOf(value) >= 0 ? value : fallback; }
  function setProfileAppearance(node, profile) {
    node.dataset.cardStyle = safeProfileChoice(profile.card_style, ['classic', 'sunset', 'ocean', 'aurora', 'midnight'], 'classic');
    node.dataset.profileEffect = safeProfileChoice(profile.profile_effect, ['none', 'glow', 'shimmer'], 'none');
    node.style.setProperty('--profile-accent', safeProfileColor(profile.accent_color));
  }

  /* ============ THEME ============ */
  var themeButton = $('#theme-toggle');
  var themeMode = ls.get('yapin:theme');
  if (themeMode !== 'dark' && themeMode !== 'light') themeMode = 'system';
  var themeMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function systemIsDark() { return !!(themeMedia && themeMedia.matches); }
  function applyTheme() {
    var dark = themeMode === 'dark' || (themeMode === 'system' && systemIsDark());
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      var icon = $('[data-theme-icon]', themeButton);
      var label = $('[data-theme-label]', themeButton);
      if (icon) icon.textContent = dark ? '☀' : '☾';
      if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
    }
    var themeColor = $('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', dark ? '#1C1014' : '#FF6B35');
  }
  applyTheme();
  if (themeButton) themeButton.addEventListener('click', function () {
    var currentlyDark = themeMode === 'dark' || (themeMode === 'system' && systemIsDark());
    themeMode = currentlyDark ? 'light' : 'dark';
    ls.set('yapin:theme', themeMode);
    applyTheme();
  });
  if (themeMedia) {
    if (themeMedia.addEventListener) themeMedia.addEventListener('change', function () { if (themeMode === 'system') applyTheme(); });
    else if (themeMedia.addListener) themeMedia.addListener(function () { if (themeMode === 'system') applyTheme(); });
  }
  function dayNumber() {
    var d = new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5) + 1;
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffledOrder(n, seed) {
    var a = [], i, r = mulberry(seed);
    for (i = 0; i < n; i++) a.push(i);
    for (i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  // Flat song catalog
  var SONGS = [];
  BANDS.forEach(function (b, bi) {
    b.s.forEach(function (s, si) { SONGS.push({ id: bi + ':' + si, b: bi, i: si, t: s[0], y: s[1], a: s[2], k: key(s[0]) }); });
    b.k = bandKey(b.n);
  });
  function songById(id) { for (var i = 0; i < SONGS.length; i++) if (SONGS[i].id === id) return SONGS[i]; return null; }

  // Autocomplete: aliases are searched too; only meaningful fragments are suggested.
  function mkCombo(input, list, items, qNorm, onSubmit) {
    var cur = [], act = -1;
    function hide() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      act = -1;
    }
    function setAct(i) {
      act = (i + cur.length) % cur.length;
      Array.prototype.forEach.call(list.children, function (li, n) {
        li.setAttribute('aria-selected', String(n === act));
      });
      input.setAttribute('aria-activedescendant', list.id + '-o' + act);
    }
    function render() {
      var q = qNorm(input.value);
      list.innerHTML = '';
      cur = [];
      act = -1;
      if (q.length < 2) { hide(); return; }
      var ranked = [];
      items.forEach(function (it) {
        var keys = Array.isArray(it.keys) ? it.keys : [it.k];
        var best = 0;
        keys.forEach(function (candidate) {
          if (!candidate) return;
          if (candidate === q) best = Math.max(best, 120);
          else if (candidate.indexOf(q) === 0) best = Math.max(best, 100);
          else if (q.length >= 4 && candidate.indexOf(q) > 0) best = Math.max(best, 65);
        });
        if (best) ranked.push({ item: it, score: best });
      });
      ranked.sort(function (a, b) { return b.score - a.score; });
      cur = ranked.slice(0, 7).map(function (entry) { return entry.item; });
      if (!cur.length) { hide(); return; }
      cur.forEach(function (it, i) {
        var li = el('li', null, it.label);
        li.setAttribute('role', 'option');
        li.id = list.id + '-o' + i;
        li.setAttribute('aria-selected', 'false');
        li.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          input.value = '';
          hide();
          onSubmit(it, it.label);
        });
        list.appendChild(li);
      });
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && cur.length && !list.hidden) {
        e.preventDefault();
        setAct(act + 1);
      } else if (e.key === 'ArrowUp' && cur.length && !list.hidden) {
        e.preventDefault();
        setAct(act - 1);
      } else if (e.key === 'Escape') {
        hide();
      } else if (e.key === 'Enter' && !list.hidden && (act >= 0 || cur.length === 1)) {
        e.preventDefault();
        var it = cur[act >= 0 ? act : 0];
        input.value = '';
        hide();
        onSubmit(it, it.label);
      }
    });
    input.addEventListener('blur', function () { setTimeout(hide, 150); });
    return {
      submitTyped: function () {
        var typed = input.value;
        if (!typed.trim()) return;
        input.value = '';
        hide();
        onSubmit(null, typed);
      },
      hide: hide
    };
  }

  function guessForm(id, placeholder) {
    return '<form class="guess" autocomplete="off" data-form>' +
      '<div class="combo"><input id="in-' + id + '" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="lb-' + id + '" aria-label="' + placeholder + '" placeholder="' + placeholder + '" autocapitalize="off" autocorrect="off" spellcheck="false" data-input>' +
      '<ul id="lb-' + id + '" role="listbox" hidden data-list></ul></div>' +
      '<button class="btn primary" type="submit" data-go>Guess</button></form>';
  }

  // Stats
  function statsGet(k) { return ls.get(k) || { played: 0, wins: 0, streak: 0, best: 0, lastWin: 0 }; }
  function statsRender(box, k) {
    var st = statsGet(k); box.innerHTML = '';
    [['Played', st.played], ['Wins', st.wins], ['Streak', st.streak], ['Best', st.best]].forEach(function (p) {
      var d = el('div'); d.appendChild(el('dt', null, p[0])); d.appendChild(el('dd', null, String(p[1]))); box.appendChild(d);
    });
  }
  function statsFinish(k, won, day) {
    var st = statsGet(k); st.played++;
    if (won) { st.wins++; st.streak = (st.lastWin === day - 1) ? st.streak + 1 : 1; st.best = Math.max(st.best, st.streak); st.lastWin = day; }
    else st.streak = 0;
    ls.set(k, st);
  }

  function copyShare(resultEl, text) {
    var fallback = function () {
      var ta = el('textarea'); ta.readOnly = true; ta.value = text; ta.setAttribute('aria-label', 'Result to copy');
      resultEl.appendChild(ta); ta.focus(); ta.select(); toast('Select the text and copy it.');
    };
    try { navigator.clipboard.writeText(text).then(function () { toast('Result copied!'); }, fallback); } catch (e) { fallback(); }
  }

  var games = {}, active = null;
  var queuedRandomGame = null;
  function surpriseGame() {
    var next = Math.random() < 0.5 ? 'song' : 'band';
    queuedRandomGame = next;
    if (location.hash === '#' + next) {
      if (games[next]) games[next].random();
      queuedRandomGame = null;
    } else {
      location.hash = '#' + next;
    }
  }
  var day = dayNumber();

  function localPuzzleDate() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  var pendingLeaderboardKey = 'yapin:leaderboard:pending';
  var pendingLeaderboardFlush = false;

  function pendingLeaderboardScores() {
    return ls.get(pendingLeaderboardKey) || [];
  }

  function createRoundId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'round-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
  }

  function leaderboardScoreKey(score) {
    if (score.roundType === 'random') return 'random:' + String(score.roundId || '');
    return 'daily:' + [score.gameMode, score.difficulty, score.puzzleDate].join(':');
  }

  function rememberPendingLeaderboardScore(score) {
    var pending = pendingLeaderboardScores().filter(function (item) {
      return leaderboardScoreKey(item) !== leaderboardScoreKey(score);
    });
    pending.push(score);
    ls.set(pendingLeaderboardKey, pending.slice(-50));
  }

  function submitLeaderboardScore(gameMode, difficulty, won, guessesUsed, roundType, roundId) {
    var type = roundType === 'random' ? 'random' : 'daily';
    var score = {
      gameMode: gameMode,
      difficulty: difficulty,
      won: Boolean(won),
      guessesUsed: guessesUsed,
      puzzleDate: localPuzzleDate(),
      roundType: type,
      roundId: type === 'random' ? String(roundId || createRoundId()) : null
    };
    rememberPendingLeaderboardScore(score);
    flushPendingLeaderboardScores();
  }

  function flushPendingLeaderboardScores() {
    var account = getAccountState();
    if (pendingLeaderboardFlush || !account.configured || !account.user || !account.profile || !isLeaderboardConfigured()) return;
    var pending = pendingLeaderboardScores();
    if (!pending.length) return;
    pendingLeaderboardFlush = true;
    Promise.all(pending.map(function (score) {
      return submitScore(score).then(function (result) {
        if (result && result.saved) {
          if (!result.duplicate && score.won) {
            var label = score.roundType === 'random' ? 'Random' : 'Daily';
            toast(label + ' score added · +' + result.points + ' points');
          }
          return score;
        }
        return null;
      }).catch(function (error) {
        console.warn('Leaderboard score is queued for another attempt.', error);
        return null;
      });
    })).then(function (completed) {
      var submitted = completed.filter(Boolean);
      if (!submitted.length) return;
      var submittedKeys = new Set(submitted.map(leaderboardScoreKey));
      var remaining = pendingLeaderboardScores().filter(function (score) {
        return !submittedKeys.has(leaderboardScoreKey(score));
      });
      ls.set(pendingLeaderboardKey, remaining);
      getPlayerLeaderboardEntry().catch(function (error) {
        console.warn('Could not refresh the player points after a game.', error);
      }).finally(function () {
        if (leaderboardUI) leaderboardUI.refresh();
      });
    }).finally(function () {
      pendingLeaderboardFlush = false;
    });
  }

  function addDailyLeaderboardPrompt(resultEl, won, roundType) {
    var account = getAccountState();
    var note = el('div', 'lb-game-note');
    var label = roundType === 'random' ? 'Random' : 'Daily';
    var message = account.user && account.profile
      ? (won ? label + ' win points are being added to your player card.' : 'This ' + label + ' attempt is recorded. A win is worth 100–200 points.')
      : 'Play as a guest, or sign in if you want your name and rank to appear on the shared leaderboard.';
    note.appendChild(el('p', null, message));
    if (!account.user || !account.profile) {
      var link = el('a', 'btn', 'Open leaderboard');
      link.href = '#leaderboard';
      note.appendChild(link);
    }
    var taskLink = el('a', 'btn', 'Daily tasks');
    taskLink.href = '#tasks';
    note.appendChild(taskLink);
    resultEl.appendChild(note);
  }

  /* ============ DIFFICULTY ============ */

  var DIFFS = ['easy', 'medium', 'hard'];
  var DIFF_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  var SONG_LIVES = { easy: 8, medium: 6, hard: 4 };
  var BAND_TRIES = { easy: 9, medium: 7, hard: 5 };
  // Fame tiers: 1 = very famous, 2 = well known, 3 = deeper cuts. Easy uses only tier 1 bands and their top hits.
  var T1 = ['Queen','Nirvana','Metallica','Coldplay','The Beatles','Led Zeppelin',"Guns N' Roses",'AC/DC','Linkin Park','Green Day','ABBA','Pink Floyd','Imagine Dragons','Maroon 5','Red Hot Chili Peppers','Oasis','A. R. Rahman','Arijit Singh','Shreya Ghoshal','Lata Mangeshkar','Kishore Kumar','Diljit Dosanjh','The Local Train','Indian Ocean','Papon','Zubeen Garg','Bhupen Hazarika','Anuv Jain'];
  var T3 = ['Ramones','The Clash','The Cure','Depeche Mode','Roxette','Journey','Scorpions','Gorillaz','Muse','Los Hermanos','Titãs','Sepultura','Paramore','Radiohead','Prateek Kuhad','Ritviz','When Chai Met Toast','Seedhe Maut'];
  var POOL_TIERS = { easy: [1], medium: [1, 2], hard: [2, 3] };
  var SONG_MAXIDX = { easy: 1, medium: 3, hard: 99 };
  function tierOf(b) { return T1.indexOf(b.n) >= 0 ? 1 : (T3.indexOf(b.n) >= 0 ? 3 : 2); }
  function bandPool(d) { var out = []; BANDS.forEach(function (b, i) { if (POOL_TIERS[d].indexOf(tierOf(b)) >= 0) out.push(i); }); return out; }
  function songPool(d) { return SONGS.filter(function (s) { return POOL_TIERS[d].indexOf(tierOf(BANDS[s.b])) >= 0 && s.i <= SONG_MAXIDX[d]; }); }
  var diffPref = ls.get('yapin:diff') || {};
  function getDiff(g) { return DIFFS.indexOf(diffPref[g]) >= 0 ? diffPref[g] : 'medium'; }
  function setDiffPref(g, d) { diffPref[g] = d; ls.set('yapin:diff', diffPref); }
  function diffBarHtml() {
    return '<div class="diffbar"><div class="seg" role="group" aria-label="Difficulty">' +
      DIFFS.map(function (d) { return '<button type="button" data-diff="' + d + '" aria-pressed="false">' + DIFF_NAME[d] + '</button>'; }).join('') +
      '</div><p class="diffnote" data-diffnote></p></div>';
  }

  /* ============ GAME 1: GUESS THE SONG (band -> 3 hits) ============ */

  function gameSong() {
    var root = document.getElementById('v-song');
    var HINT_CAP = 3, orders = {};
    var S = { mode: 'daily', diff: getDiff('song'), bi: 0, guesses: [], done: false, won: false, counted: false, hints: 0, roundId: null };
    var NOTES = {
      easy: '8 lives · famous bands · 3 hints · free hint button',
      medium: '6 lives · well-known bands · 3 hints · button costs 1 life',
      hard: '4 lives · deeper cuts · 3 hints unlock on misses'
    };
    function orderFor(d) { if (!orders[d]) orders[d] = shuffledOrder(bandPool(d).length, 20260 + DIFFS.indexOf(d)); return orders[d]; }
    function lives() { return SONG_LIVES[S.diff]; }
    // On Medium each hint-button use costs one life; on Easy it is free; Hard has no button.
    function spent() { return misses().length + (S.diff === 'medium' ? S.hints : 0); }
    function canHint() { return S.diff === 'easy' || (S.diff === 'medium' && lives() - spent() > 1); }
    // Medium keeps the original storage keys so earlier progress and stats survive.
    function sKey() { return 'yapin:song:stats' + (S.diff === 'medium' ? '' : ':' + S.diff); }
    function sk() { return 'yapin:song:daily:' + day + (S.diff === 'medium' ? '' : ':' + S.diff); }

    root.innerHTML =
      '<div class="game">' +
        '<div class="game-head"><div><h1>Guess the Song</h1><p class="lede">We name the band. You name three of its biggest hits before you run out of lives.</p></div>' +
          '<div class="seg" role="group" aria-label="Game mode"><button type="button" data-mode="daily" aria-pressed="true">Daily</button><button type="button" data-mode="random" aria-pressed="false">Random</button></div></div>' +
        diffBarHtml() +
        '<p class="meta" data-meta></p>' +
        '<div class="target" data-target></div>' +
        '<div class="game-info-host" data-game-info></div>' +
        '<div class="status"><span class="count" data-count></span><span class="lives" data-lives aria-label="Lives left"></span></div>' +
        '<div class="slots" data-slots></div>' +
        '<div class="clue" data-clue></div>' +
        '<div class="wrongs" data-wrongs></div>' +
        guessForm('song', 'Type a song title…') +
        '<div class="result" data-result hidden></div>' +
        '<div class="game-actions"><button type="button" class="btn" data-hint>Give me a hint</button><button type="button" class="btn" data-new hidden>New random band</button><button type="button" class="btn surprise-btn" data-surprise>Surprise me</button></div>' +
        '<p class="meta" data-statlbl></p>' +
        '<dl class="stats" data-stats></dl>' +
      '</div>';
    var meta = $('[data-meta]', root), target = $('[data-target]', root), count = $('[data-count]', root), livesEl = $('[data-lives]', root);
    var slots = $('[data-slots]', root), clue = $('[data-clue]', root), wrongs = $('[data-wrongs]', root), form = $('[data-form]', root);
    var input = $('[data-input]', root), list = $('[data-list]', root), go = $('[data-go]', root), resultEl = $('[data-result]', root), newBtn = $('[data-new]', root), statsEl = $('[data-stats]', root);
    var statLbl = $('[data-statlbl]', root), diffNote = $('[data-diffnote]', root);
    var gameInfoEl = $('[data-game-info]', root);
    var bandSpotlight = { name: '', data: null, loading: false, error: false };

    var items = SONGS.map(function (s) { return { label: s.t, k: s.k, keys: [s.k], song: s }; });
    var hintBtn = $('[data-hint]', root);
    $('[data-surprise]', root).addEventListener('click', surpriseGame);
    hintBtn.addEventListener('click', function () {
      if (S.done || !canHint() || hintCount() >= HINT_CAP) return;
      S.hints++; save(); render();
    });
    var combo = mkCombo(input, list, items, key, function (it, typed) { submit(it ? it.song : lookup(typed, SONGS, function (s) { return [s.t].concat(s.aliases || []); }, key)); });
    form.addEventListener('submit', function (e) { e.preventDefault(); combo.submitTyped(); });

    function save() { if (S.mode === 'daily') ls.set(sk(), { g: S.guesses.map(function (g) { return g.id; }), counted: S.counted, h: S.hints }); }
    function band() { return BANDS[S.bi]; }
    function found() { return S.guesses.filter(function (g) { return g.ok; }); }
    function misses() { return S.guesses.filter(function (g) { return !g.ok; }); }

    function renderBandSpotlight() {
      var b = band();
      if (bandSpotlight.name !== b.n) bandSpotlight = { name: b.n, data: null, loading: false, error: false };
      gameInfoEl.innerHTML = '';
      var card = el('section', 'game-info-card');
      var top = el('div', 'game-info-top');
      var copy = el('div', 'game-info-copy');
      copy.appendChild(el('span', 'game-info-kicker', 'ARTIST SPOTLIGHT'));
      copy.appendChild(el('h2', null, b.n));
      copy.appendChild(el('p', 'game-info-sub', b.type === 'artist' ? 'Artist background and music notes.' : 'Band background and music notes.'));
      top.appendChild(copy);
      if (bandSpotlight.data && bandSpotlight.data.image) {
        var photo = el('img', 'game-info-image');
        photo.src = bandSpotlight.data.image;
        photo.alt = 'Photo related to ' + b.n;
        photo.loading = 'lazy';
        top.appendChild(photo);
      }
      card.appendChild(top);
      var facts = el('div', 'game-info-facts');
      [[b.type === 'artist' ? 'Active since' : 'Formed', b.y], ['Country', b.c], ['Genre', b.g], ['Yapin tracks', b.s.length], ['From', b.origin], ['Languages', b.languages]].forEach(function (item) {
        if (item[1] == null || item[1] === '') return;
        var fact = el('div', 'game-info-fact');
        fact.appendChild(el('small', null, item[0]));
        fact.appendChild(el('b', null, String(item[1])));
        facts.appendChild(fact);
      });
      card.appendChild(facts);
      if (b.bio) card.appendChild(el('p', 'game-info-extract', b.bio));
      if (bandSpotlight.data && bandSpotlight.data.description) card.appendChild(el('p', 'game-info-sub', bandSpotlight.data.description));
      if (bandSpotlight.data && bandSpotlight.data.extract) card.appendChild(el('p', 'game-info-extract', bandSpotlight.data.extract));
      if (bandSpotlight.error) card.appendChild(el('p', 'game-info-note', 'Online artist information is unavailable. The built-in band facts above are still available.'));
      var actions = el('div', 'game-info-actions');
      var load = el('button', 'btn', bandSpotlight.loading ? 'Loading artist story…' : (bandSpotlight.data ? 'Refresh artist story' : 'Load artist story'));
      load.type = 'button';
      load.disabled = bandSpotlight.loading;
      actions.appendChild(load);
      if (bandSpotlight.data && bandSpotlight.data.url) {
        var wiki = el('a', 'btn', 'Read on Wikipedia');
        wiki.href = bandSpotlight.data.url;
        wiki.target = '_blank';
        wiki.rel = 'noopener noreferrer';
        actions.appendChild(wiki);
      }
      card.appendChild(actions);
      gameInfoEl.appendChild(card);
      load.addEventListener('click', async function () {
        if (bandSpotlight.loading) return;
        bandSpotlight.loading = true;
        bandSpotlight.error = false;
        renderBandSpotlight();
        try {
          var result = await searchBandInfo(b.n);
          if (bandSpotlight.name === b.n) {
            bandSpotlight.data = result;
            if (!result) bandSpotlight.error = true;
          }
        } catch (error) {
          if (bandSpotlight.name === b.n) bandSpotlight.error = true;
        } finally {
          if (bandSpotlight.name === b.n) {
            bandSpotlight.loading = false;
            renderBandSpotlight();
          }
        }
      });
    }

    function start(mode) {
      S.mode = mode;
      S.roundId = mode === 'random' ? createRoundId() : null;
      var bp = bandPool(S.diff);
      if (mode === 'daily') { var ord = orderFor(S.diff); S.bi = bp[ord[(day - 1) % ord.length]]; }
      else { var n; do { n = bp[Math.floor(Math.random() * bp.length)]; } while (n === S.bi && bp.length > 1); S.bi = n; }
      S.guesses = []; S.done = false; S.won = false; S.counted = false; S.hints = 0;
      if (mode === 'daily') {
        var saved = ls.get(sk());
        if (saved && Array.isArray(saved.g)) {
          saved.g.forEach(function (id) { var s = songById(id); if (s && !S.guesses.some(function (g) { return g.id === id; })) S.guesses.push({ id: id, ok: s.b === S.bi }); });
          S.hints = S.diff === 'hard' ? 0 : Math.min(HINT_CAP, saved.h | 0);
          S.counted = !!saved.counted;
        }
      }
      if (found().length >= NEED) { S.done = true; S.won = true; }
      else if (spent() >= lives()) { S.done = true; S.won = false; }
      $('[data-mode="daily"]', root).setAttribute('aria-pressed', String(mode === 'daily'));
      $('[data-mode="random"]', root).setAttribute('aria-pressed', String(mode === 'random'));
      root.querySelectorAll('[data-diff]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.diff === S.diff)); });
      diffNote.textContent = NOTES[S.diff] + ' · maximum 3 hints per round';
      statLbl.textContent = 'Your stats · ' + DIFF_NAME[S.diff];
      resultEl.hidden = true;
      render(); statsRender(statsEl, sKey());
      if (S.done) showResult();
    }

    function render() {
      var b = band();
      meta.textContent = (S.mode === 'daily' ? 'Daily puzzle #' + day : 'Random round') + ' · ' + DIFF_NAME[S.diff];
      target.innerHTML = '';
      target.appendChild(el('div', 'lbl', 'Name ' + NEED + ' hits by'));
      target.appendChild(el('div', 'big', b.n));
      if (S.diff === 'hard') {
        target.appendChild(el('div', 'info', 'From ' + b.c));
      } else {
        target.appendChild(el('div', 'info', 'Formed ' + b.y + ' · ' + b.c + ' · ' + b.g));
        var ys = b.s.map(function (s) { return s[1]; });
        target.appendChild(el('div', 'info', 'Their big hits came out between ' + Math.min.apply(null, ys) + ' and ' + Math.max.apply(null, ys) + '.'));
      }
      var f = found(), m = misses(), L = lives();
      count.textContent = f.length + ' of ' + NEED + ' hits found';
      livesEl.innerHTML = '';
      for (var i = 0; i < L; i++) { var p = el('span', 'pip'); if (i >= L - spent()) p.setAttribute('data-off', ''); livesEl.appendChild(p); }
      slots.innerHTML = '';
      for (var n = 0; n < NEED; n++) {
        var sl = el('div', 'slot');
        if (f[n]) {
          var s = songById(f[n].id); sl.setAttribute('data-found', '');
          sl.appendChild(el('b', null, s.t)); sl.appendChild(el('small', null, s.y + ' · ' + s.a));
        } else { sl.appendChild(el('span', null, 'Hit ' + (n + 1))); sl.appendChild(el('small', null, '?')); }
        slots.appendChild(sl);
      }
      renderBandSpotlight();
      renderClue();
      wrongs.innerHTML = '';
      if (m.length) {
        wrongs.appendChild(el('span', null, 'Not by ' + b.n + ':'));
        m.forEach(function (g) { var s = songById(g.id); wrongs.appendChild(el('span', 'w', s.t)); });
      }
      input.disabled = S.done; go.disabled = S.done;
      newBtn.hidden = !(S.mode === 'random' || S.done);
    }

    // One hint per miss (plus free ones on Easy), capped at HINT_CAP.
    function hintCount() { return Math.min(HINT_CAP, misses().length + S.hints); }
    function maskTitle(title, withLast) {
      return title.split(' ').map(function (w) {
        var chars = w.split(''), alnum = chars.filter(function (c) { return /[\p{L}\p{N}]/u.test(c); }).length, pos = -1;
        return chars.map(function (c) {
          if (!/[\p{L}\p{N}]/u.test(c)) return c;
          pos++;
          return (pos === 0 || (withLast && pos === alnum - 1)) ? c : '_';
        }).join(' ');
      }).join('   ·   ');
    }
    // Hints come in threes per hit that is still hidden: first letters, album and year, last letters.
    function hintItems(n) {
      var b = band(), done = found().map(function (g) { return g.id; }), U = [], out = [], i;
      for (i = 0; i < b.s.length; i++) if (done.indexOf(S.bi + ':' + i) < 0) U.push(b.s[i]);
      if (!U.length) return out;
      for (i = 0; i < n; i++) {
        var hit = U[Math.floor(i / 3) % U.length], step = i % 3;
        if (step === 0) out.push('One of their hits starts like this: ' + maskTitle(hit[0], false));
        else if (step === 1) out.push('Same hit: it is on the album “' + hit[2] + '” (' + hit[1] + ').');
        else out.push('Same hit, now with the last letters: ' + maskTitle(hit[0], true));
      }
      return out;
    }
    function updateHintBtn() {
      hintBtn.hidden = S.diff === 'hard';
      var full = hintCount() >= HINT_CAP;
      hintBtn.disabled = S.done || full || !canHint();
      hintBtn.textContent = full ? 'No more hints' : (S.diff === 'medium' ? 'Give me a hint (costs 1 life)' : 'Give me a hint (free)');
    }
    function renderClue() {
      clue.innerHTML = '';
      if (S.done) { clue.hidden = true; updateHintBtn(); return; }
      clue.hidden = false;
      var n = hintCount();
      clue.appendChild(el('div', 'lbl', 'Hints (' + n + '/' + HINT_CAP + ')'));
      if (!n) {
        clue.appendChild(el('p', null, 'Wrong guesses unlock up to three hints about one of the hits.' + (S.diff !== 'hard' ? ' Stuck? Tap “Give me a hint”.' : '')));
        updateHintBtn(); return;
      }
      var all = hintItems(n), ul = el('ul');
      all.forEach(function (t, i) {
        var li = el('li', i === all.length - 1 ? 'new' : null);
        li.appendChild(el('b', null, 'Hint ' + (i + 1) + ':')); li.appendChild(document.createTextNode(t)); ul.appendChild(li);
      });
      clue.appendChild(ul);
      updateHintBtn();
    }

    function submit(song) {
      if (S.done) return;
      if (!song) { toast('Song not found. Pick a title from the suggestions.'); return; }
      if (S.guesses.some(function (g) { return g.id === song.id; })) { toast('You already tried that one.'); return; }
      var ok = song.b === S.bi;
      S.guesses.push({ id: song.id, ok: ok });
      if (found().length >= NEED) { S.done = true; S.won = true; }
      else if (spent() >= lives()) { S.done = true; S.won = false; }
      if (ok) toast('Yes! That is one of their hits.');
      else toast('Not this band. “' + song.t + '” is by ' + BANDS[song.b].n + '.' + (S.done ? '' : ' New hint unlocked!'));
      save(); render();
      if (S.done) finish();
      input.focus();
    }

    function finish() {
      if (S.mode === 'daily' && !S.counted) {
        statsFinish(sKey(), S.won, day);
        S.counted = true;
        save();
        statsRender(statsEl, sKey());
        submitLeaderboardScore('song', S.diff, S.won, S.guesses.length, 'daily');
      } else if (S.mode === 'random') {
        submitLeaderboardScore('song', S.diff, S.won, S.guesses.length, 'random', S.roundId);
      }
      showResult();
    }

    function shareText() {
      var line = S.guesses.map(function (g) { return g.ok ? '🟩' : '⬛'; }).join('');
      return 'Yapin Music · Guess the Song' + (S.mode === 'daily' ? ' #' + day : ' (random)') + ' · ' + DIFF_NAME[S.diff] + '\n' + (S.won ? 'Found ' + NEED + ' hits' : 'Out of lives') + ' · ' + misses().length + ' miss' + (misses().length === 1 ? '' : 'es') + '\n' + line;
    }

    function showResult() {
      var b = band();
      resultEl.innerHTML = '';
      resultEl.appendChild(el('h2', null, S.won ? 'You got it! ' + misses().length + ' miss' + (misses().length === 1 ? '' : 'es') + '.' : 'Out of lives.'));
      resultEl.appendChild(el('p', 'sub', 'Biggest hits by ' + b.n + ':'));
      var ul = el('ul');
      b.s.forEach(function (s) { ul.appendChild(el('li', null, s[0] + ' · ' + s[1])); });
      resultEl.appendChild(ul);
      if (S.mode === 'daily') {
        resultEl.appendChild(el('p', 'sub', 'Come back tomorrow for a new daily puzzle.'));
      }
      addDailyLeaderboardPrompt(resultEl, S.won, S.mode);
      var acts = el('div', 'acts');
      var copy = el('button', 'btn primary', 'Copy result'); copy.type = 'button';
      var again = el('button', 'btn', 'Play a random one'); again.type = 'button';
      acts.appendChild(copy); acts.appendChild(again); resultEl.appendChild(acts);
      copy.addEventListener('click', function () { copyShare(resultEl, shareText()); });
      again.addEventListener('click', function () { start('random'); });
      resultEl.hidden = false;
    }

    newBtn.addEventListener('click', function () { start('random'); });
    root.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.mode !== S.mode) start(b.dataset.mode); }); });
    root.querySelectorAll('[data-diff]').forEach(function (b) {
      b.addEventListener('click', function () { if (b.dataset.diff !== S.diff) { S.diff = b.dataset.diff; setDiffPref('song', S.diff); start(S.mode); } });
    });
    var api = {
      ready: false,
      init: function () { if (!api.ready) { api.ready = true; start('daily'); } },
      random: function () { api.init(); start('random'); }
    };
    return api;
  }

  /* ============ GAME 2: GUESS THE BAND (song -> band) ============ */

  function gameBand() {
    var root = document.getElementById('v-band');
    var HINT_CAP = 3, orders = {};
    var S = { mode: 'daily', diff: getDiff('band'), song: null, guesses: [], done: false, won: false, counted: false, hints: 0, roundId: null };
    var NOTES = {
      easy: '9 guesses · famous songs · 3 hints · free hint button',
      medium: '7 guesses · well-known songs · 3 hints · button costs 1 guess',
      hard: '5 guesses · deeper cuts · 3 hints unlock on misses'
    };
    function orderFor(d) { if (!orders[d]) orders[d] = shuffledOrder(songPool(d).length, 77030 + DIFFS.indexOf(d)); return orders[d]; }
    function maxG() { return BAND_TRIES[S.diff]; }
    function spent() { return S.guesses.length + (S.diff === 'medium' ? S.hints : 0); }
    function canHint() { return S.diff === 'easy' || (S.diff === 'medium' && maxG() - spent() > 1); }
    function sKey() { return 'yapin:band:stats' + (S.diff === 'medium' ? '' : ':' + S.diff); }
    function sk() { return 'yapin:band:daily:' + day + (S.diff === 'medium' ? '' : ':' + S.diff); }

    root.innerHTML =
      '<div class="game">' +
        '<div class="game-head"><div><h1>Guess the Band</h1><p class="lede">We name the song. You find the band before you run out of guesses.</p></div>' +
          '<div class="seg" role="group" aria-label="Game mode"><button type="button" data-mode="daily" aria-pressed="true">Daily</button><button type="button" data-mode="random" aria-pressed="false">Random</button></div></div>' +
        diffBarHtml() +
        '<p class="meta" data-meta></p>' +
        '<div class="target" data-target></div>' +
        '<div class="game-info-host" data-game-info></div>' +
        '<div class="status"><span class="count" data-count></span></div>' +
        '<div class="clue" data-hints></div>' +
        '<div class="grows" data-rows></div>' +
        guessForm('band', 'Type a band name…') +
        '<div class="result" data-result hidden></div>' +
        '<div class="game-actions"><button type="button" class="btn" data-hint>Give me a hint</button><button type="button" class="btn" data-new hidden>New random song</button><button type="button" class="btn surprise-btn" data-surprise>Surprise me</button></div>' +
        '<p class="meta" data-statlbl></p>' +
        '<dl class="stats" data-stats></dl>' +
      '</div>';
    var meta = $('[data-meta]', root), target = $('[data-target]', root), count = $('[data-count]', root), rowsEl = $('[data-rows]', root), form = $('[data-form]', root);
    var input = $('[data-input]', root), list = $('[data-list]', root), go = $('[data-go]', root), resultEl = $('[data-result]', root), newBtn = $('[data-new]', root), statsEl = $('[data-stats]', root);
    var statLbl = $('[data-statlbl]', root), diffNote = $('[data-diffnote]', root);
    var gameInfoEl = $('[data-game-info]', root);
    var trackSpotlight = { id: '', data: null, loading: false, error: false };
    var artistSpotlight = { name: '', data: null, loading: false, error: false };

    var items = BANDS.map(function (b, i) { return { label: b.n, k: b.k, keys: [b.k].concat((b.aliases || []).map(bandKey)), bi: i }; });
    var hintBtn = $('[data-hint]', root), hintsEl = $('[data-hints]', root);
    $('[data-surprise]', root).addEventListener('click', surpriseGame);
    hintBtn.addEventListener('click', function () {
      if (S.done || !canHint() || hintCount() >= HINT_CAP) return;
      S.hints++; save(); render();
    });
    var combo = mkCombo(input, list, items, bandKey, function (it, typed) {
      var bi = it ? it.bi : null;
      if (bi == null) { var f = lookup(typed, BANDS, function (b) { return [b.n].concat(b.aliases || []); }, bandKey); bi = f ? BANDS.indexOf(f) : null; }
      submit(bi);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); combo.submitTyped(); });

    function save() { if (S.mode === 'daily') ls.set(sk(), { g: S.guesses, counted: S.counted, h: S.hints }); }
    function answer() { return BANDS[S.song.b]; }

    function addGameInfoFact(parent, label, value) {
      if (value == null || value === '') return;
      var fact = el('div', 'game-info-fact');
      fact.appendChild(el('small', null, label));
      fact.appendChild(el('b', null, String(value)));
      parent.appendChild(fact);
    }
    function formatTrackDuration(milliseconds) {
      var seconds = Math.round(milliseconds / 1000);
      return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    }
    function renderTrackSpotlight() {
      var song = S.song, artist = answer();
      if (trackSpotlight.id !== song.id) trackSpotlight = { id: song.id, data: null, loading: false, error: false };
      if (artistSpotlight.name !== artist.n) artistSpotlight = { name: artist.n, data: null, loading: false, error: false };
      gameInfoEl.innerHTML = '';
      var card = el('section', 'game-info-card');
      var top = el('div', 'game-info-top');
      var copy = el('div', 'game-info-copy');
      copy.appendChild(el('span', 'game-info-kicker', 'TRACK SPOTLIGHT'));
      copy.appendChild(el('h2', null, song.t));
      copy.appendChild(el('p', 'game-info-sub', 'Album: ' + song.a));
      if (S.done) copy.appendChild(el('p', 'game-info-answer', 'Artist: ' + artist.n));
      else copy.appendChild(el('p', 'game-info-sub', 'The performer stays hidden until you solve the round.'));
      top.appendChild(copy);
      if (trackSpotlight.data && trackSpotlight.data.artwork) {
        var artwork = el('img', 'game-info-image game-info-artwork');
        artwork.src = trackSpotlight.data.artwork;
        artwork.alt = 'Album artwork for ' + song.t;
        artwork.loading = 'lazy';
        top.appendChild(artwork);
      }
      card.appendChild(top);
      var facts = el('div', 'game-info-facts');
      if (trackSpotlight.data) {
        if (trackSpotlight.data.releaseDate) addGameInfoFact(facts, 'Release', new Date(trackSpotlight.data.releaseDate).getFullYear());
        if (trackSpotlight.data.genre) addGameInfoFact(facts, 'Genre', trackSpotlight.data.genre);
        if (trackSpotlight.data.duration) addGameInfoFact(facts, 'Length', formatTrackDuration(trackSpotlight.data.duration));
      } else if (S.diff === 'hard' && !S.done) {
        addGameInfoFact(facts, 'Extra clues', 'Unlocked after the round');
      } else {
        addGameInfoFact(facts, 'Release year', song.y);
        addGameInfoFact(facts, 'Album', song.a);
      }
      if (facts.children.length) card.appendChild(facts);
      if (trackSpotlight.error) card.appendChild(el('p', 'game-info-note', 'The online track catalogue could not be reached. Your guessing round is unaffected.'));
      var actions = el('div', 'game-info-actions');
      var trackButton = el('button', 'btn', trackSpotlight.loading ? 'Loading track details…' : (trackSpotlight.data ? 'Refresh track details' : 'Load track details'));
      trackButton.type = 'button';
      trackButton.disabled = trackSpotlight.loading || (S.diff === 'hard' && !S.done);
      if (S.diff === 'hard' && !S.done) trackButton.textContent = 'Track details unlock after the round';
      actions.appendChild(trackButton);
      if (S.done && trackSpotlight.data && trackSpotlight.data.url) {
        var apple = el('a', 'btn', 'Open Apple Music');
        apple.href = trackSpotlight.data.url;
        apple.target = '_blank';
        apple.rel = 'noopener noreferrer';
        actions.appendChild(apple);
      }
      card.appendChild(actions);
      if (S.done) {
        var artistSection = el('div', 'game-info-artist');
        artistSection.appendChild(el('span', 'game-info-kicker', 'ARTIST STORY'));
        if (artistSpotlight.data && artistSpotlight.data.image) {
          var artistImage = el('img', 'game-info-image');
          artistImage.src = artistSpotlight.data.image;
          artistImage.alt = 'Photo related to ' + artist.n;
          artistImage.loading = 'lazy';
          artistSection.appendChild(artistImage);
        }
        if (artistSpotlight.data && artistSpotlight.data.description) artistSection.appendChild(el('p', 'game-info-sub', artistSpotlight.data.description));
        if (artistSpotlight.data && artistSpotlight.data.extract) artistSection.appendChild(el('p', 'game-info-extract', artistSpotlight.data.extract));
        if (artistSpotlight.error) artistSection.appendChild(el('p', 'game-info-note', 'Artist biography is unavailable right now.'));
        var artistButton = el('button', 'btn', artistSpotlight.loading ? 'Loading artist story…' : (artistSpotlight.data ? 'Refresh artist story' : 'Read about ' + artist.n));
        artistButton.type = 'button';
        artistButton.disabled = artistSpotlight.loading;
        artistSection.appendChild(artistButton);
        if (artistSpotlight.data && artistSpotlight.data.url) {
          var wiki = el('a', 'btn', 'Wikipedia article');
          wiki.href = artistSpotlight.data.url;
          wiki.target = '_blank';
          wiki.rel = 'noopener noreferrer';
          artistSection.appendChild(wiki);
        }
        card.appendChild(artistSection);
        artistButton.addEventListener('click', async function () {
          if (artistSpotlight.loading) return;
          artistSpotlight.loading = true;
          renderTrackSpotlight();
          try {
            var artistResult = await searchBandInfo(artist.n);
            if (artistSpotlight.name === artist.n) {
              artistSpotlight.data = artistResult;
              if (!artistResult) artistSpotlight.error = true;
            }
          } catch (error) {
            if (artistSpotlight.name === artist.n) artistSpotlight.error = true;
          } finally {
            if (artistSpotlight.name === artist.n) {
              artistSpotlight.loading = false;
              renderTrackSpotlight();
            }
          }
        });
      }
      gameInfoEl.appendChild(card);
      trackButton.addEventListener('click', async function () {
        if (trackSpotlight.loading || (S.diff === 'hard' && !S.done)) return;
        trackSpotlight.loading = true;
        trackSpotlight.error = false;
        renderTrackSpotlight();
        try {
          var results = await searchSongInfo(song.t);
          var matchingTrack = results.find(function (item) { return key(item.title) === key(song.t); }) || results[0] || null;
          if (trackSpotlight.id === song.id) {
            trackSpotlight.data = matchingTrack;
            if (!matchingTrack) trackSpotlight.error = true;
          }
        } catch (error) {
          if (trackSpotlight.id === song.id) trackSpotlight.error = true;
        } finally {
          if (trackSpotlight.id === song.id) {
            trackSpotlight.loading = false;
            renderTrackSpotlight();
          }
        }
      });
    }

    function compare(g, a) {
      var gl = sortLetter(g.n), al = sortLetter(a.n);
      return {
        country: { s: g.c === a.c ? 'correct' : '', v: g.c },
        genre: { s: g.g === a.g ? 'correct' : (g.f === a.f ? 'present' : ''), v: g.g },
        formed: { s: g.y === a.y ? 'correct' : (Math.abs(g.y - a.y) <= 5 ? 'present' : ''), v: g.y + (g.y < a.y ? ' ↑' : (g.y > a.y ? ' ↓' : '')) },
        letter: { s: gl === al ? 'correct' : '', v: gl + (gl < al ? ' ↑' : (gl > al ? ' ↓' : '')) }
      };
    }

    function start(mode) {
      S.mode = mode;
      S.roundId = mode === 'random' ? createRoundId() : null;
      var sp = songPool(S.diff);
      if (mode === 'daily') { var ord = orderFor(S.diff); S.song = sp[ord[(day - 1) % ord.length]]; }
      else { var s; do { s = sp[Math.floor(Math.random() * sp.length)]; } while (s === S.song && sp.length > 1); S.song = s; }
      S.guesses = []; S.done = false; S.won = false; S.counted = false; S.hints = 0;
      if (mode === 'daily') {
        var saved = ls.get(sk());
        if (saved && Array.isArray(saved.g)) {
          saved.g.forEach(function (bi) { if (typeof bi === 'number' && BANDS[bi] && S.guesses.indexOf(bi) < 0) S.guesses.push(bi); });
          S.hints = S.diff === 'hard' ? 0 : Math.min(HINT_CAP, saved.h | 0);
          S.counted = !!saved.counted;
        }
      }
      if (S.guesses.indexOf(S.song.b) >= 0) { S.done = true; S.won = true; }
      else if (spent() >= maxG()) { S.done = true; S.won = false; }
      $('[data-mode="daily"]', root).setAttribute('aria-pressed', String(mode === 'daily'));
      $('[data-mode="random"]', root).setAttribute('aria-pressed', String(mode === 'random'));
      root.querySelectorAll('[data-diff]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.diff === S.diff)); });
      diffNote.textContent = NOTES[S.diff] + ' · maximum 3 hints per round';
      statLbl.textContent = 'Your stats · ' + DIFF_NAME[S.diff];
      resultEl.hidden = true;
      render(); statsRender(statsEl, sKey());
      if (S.done) showResult();
    }

    function hintList() {
      var a = answer(), others = [], i, lettersOnly = a.n.replace(/[^\p{L}\p{N}]/gu, '');
      for (i = 0; i < a.s.length; i++) { if (a.s[i][0] !== S.song.t) others.push(a.s[i][0]); }
      var words = a.n.split(' ').length;
      return [
        ['Country', 'The band is from ' + a.c + '.'],
        ['Genre', a.g + '. This song is on the album “' + S.song.a + '”.'],
        ['Formed', 'The band started in ' + a.y + '.'],
        ['Another song', 'They also made “' + others[0] + '”.'],
        ['Name', 'It starts with ' + sortLetter(a.n) + (/^the\s/i.test(a.n) ? ' (ignoring “The”)' : '') + ' and has ' + words + ' word' + (words > 1 ? 's' : '') + '.'],
        ['Another song', 'They also made “' + (others[1] || others[0]) + '”.'],
        ['Name length', 'The full name has ' + lettersOnly.length + ' letters, not counting spaces or symbols.'],
        ['Last letter', 'The name ends with ' + lettersOnly.slice(-1).toUpperCase() + '.']
      ];
    }
    function hintCount() { return Math.min(HINT_CAP, S.guesses.length + S.hints); }
    function renderHints() {
      hintsEl.innerHTML = '';
      var n = hintCount();
      hintBtn.hidden = S.diff === 'hard';
      hintBtn.disabled = S.done || n >= HINT_CAP || !canHint();
      hintBtn.textContent = n >= HINT_CAP ? 'No more hints' : (S.diff === 'medium' ? 'Give me a hint (costs 1 guess)' : 'Give me a hint (free)');
      if (S.done) { hintsEl.hidden = true; return; }
      hintsEl.hidden = false;
      hintsEl.appendChild(el('div', 'lbl', 'Hints (' + n + '/' + HINT_CAP + ')'));
      if (!n) { hintsEl.appendChild(el('p', null, 'Wrong guesses unlock up to three hints about the band.' + (S.diff !== 'hard' ? ' Stuck? Tap “Give me a hint”.' : ''))); return; }
      var ul = el('ul'), all = hintList();
      for (var i = 0; i < n; i++) {
        var li = el('li', i === n - 1 ? 'new' : null); li.appendChild(el('b', null, all[i][0] + ':')); li.appendChild(document.createTextNode(all[i][1])); ul.appendChild(li);
      }
      hintsEl.appendChild(ul);
    }

    function render() {
      var n = S.guesses.length;
      renderTrackSpotlight();
      meta.textContent = (S.mode === 'daily' ? 'Daily puzzle #' + day : 'Random round') + ' · ' + DIFF_NAME[S.diff];
      target.innerHTML = '';
      target.appendChild(el('div', 'lbl', 'Which band plays'));
      target.appendChild(el('div', 'big', '“' + S.song.t + '”'));
      if (S.diff !== 'hard') target.appendChild(el('div', 'info', 'Released ' + S.song.y));
      count.textContent = S.done ? (S.won ? 'Solved in ' + n + ' of ' + maxG() : 'Out of guesses') : 'Guess ' + Math.min(spent() + 1, maxG()) + ' of ' + maxG();
      renderHints();
      rowsEl.innerHTML = '';
      S.guesses.forEach(function (bi, idx) {
        var g = BANDS[bi], c = compare(g, answer());
        var row = el('div', 'grow'), head = el('div', 'gn');
        head.appendChild(document.createTextNode(g.n)); head.appendChild(el('span', null, '#' + (idx + 1)));
        row.appendChild(head);
        var chips = el('div', 'chips');
        [['Country', c.country], ['Genre', c.genre], ['Formed', c.formed], ['Starts with', c.letter]].forEach(function (p) {
          var ch = el('div', 'chip'); if (p[1].s) ch.setAttribute('data-s', p[1].s);
          ch.appendChild(el('small', null, p[0])); ch.appendChild(el('b', null, String(p[1].v))); chips.appendChild(ch);
        });
        row.appendChild(chips); rowsEl.appendChild(row);
      });
      input.disabled = S.done; go.disabled = S.done;
      newBtn.hidden = !(S.mode === 'random' || S.done);
    }

    function submit(bi) {
      if (S.done) return;
      if (bi == null) { toast('Band not found. Pick a name from the suggestions.'); return; }
      if (S.guesses.indexOf(bi) >= 0) { toast('You already tried that band.'); return; }
      S.guesses.push(bi);
      if (bi === S.song.b) { S.done = true; S.won = true; }
      else if (spent() >= maxG()) { S.done = true; S.won = false; }
      if (!S.done) toast('Not this band. New hint unlocked!');
      save(); render();
      if (S.done) {
        if (S.mode === 'daily' && !S.counted) {
          statsFinish(sKey(), S.won, day);
          S.counted = true;
          save();
          statsRender(statsEl, sKey());
          submitLeaderboardScore('band', S.diff, S.won, S.guesses.length, 'daily');
        } else if (S.mode === 'random') {
          submitLeaderboardScore('band', S.diff, S.won, S.guesses.length, 'random', S.roundId);
        }
        showResult();
      }
      input.focus();
    }

    function shareText() {
      var a = answer(), map = { correct: '🟩', present: '🟨', '': '⬛' };
      var lines = S.guesses.map(function (bi) { var c = compare(BANDS[bi], a); return [c.country, c.genre, c.formed, c.letter].map(function (x) { return map[x.s]; }).join(''); });
      return 'Yapin Music · Guess the Band' + (S.mode === 'daily' ? ' #' + day : ' (random)') + ' · ' + DIFF_NAME[S.diff] + ' ' + (S.won ? S.guesses.length : 'X') + '/' + maxG() + '\n' + lines.join('\n');
    }

    function showResult() {
      var a = answer();
      resultEl.innerHTML = '';
      resultEl.appendChild(el('h2', null, S.won ? 'Nice! ' + S.guesses.length + '/' + maxG() + '.' : 'Not this time. It was:'));
      resultEl.appendChild(el('p', 'ans', a.n));
      resultEl.appendChild(el('p', 'sub', '“' + S.song.t + '” · ' + S.song.a + ' · ' + S.song.y));
      resultEl.appendChild(el('p', 'sub', a.g + ' · ' + a.c + ' · formed ' + a.y));
      if (S.mode === 'daily') {
        resultEl.appendChild(el('p', 'sub', 'Come back tomorrow for a new daily puzzle.'));
      }
      addDailyLeaderboardPrompt(resultEl, S.won, S.mode);
      var acts = el('div', 'acts');
      var copy = el('button', 'btn primary', 'Copy result'); copy.type = 'button';
      var again = el('button', 'btn', 'Play a random one'); again.type = 'button';
      acts.appendChild(copy); acts.appendChild(again); resultEl.appendChild(acts);
      copy.addEventListener('click', function () { copyShare(resultEl, shareText()); });
      again.addEventListener('click', function () { start('random'); });
      resultEl.hidden = false;
    }

    newBtn.addEventListener('click', function () { start('random'); });
    root.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.mode !== S.mode) start(b.dataset.mode); }); });
    root.querySelectorAll('[data-diff]').forEach(function (b) {
      b.addEventListener('click', function () { if (b.dataset.diff !== S.diff) { S.diff = b.dataset.diff; setDiffPref('band', S.diff); start(S.mode); } });
    });
    var api = {
      ready: false,
      init: function () { if (!api.ready) { api.ready = true; start('daily'); } },
      random: function () { api.init(); start('random'); }
    };
    return api;
  }


  /* ============ MUSIC EXPLORER ============ */

  function musicExplorer() {
    var root = document.getElementById('v-explore');
    var kind = 'band', busy = false;
    function localBand(query) {
      return lookup(query, BANDS, function (b) {
        return [b.n].concat(b.aliases || []);
      }, bandKey);
    }
    function addLink(parent, href, label, cls) {
      if (!href) return;
      var link = el('a', cls || 'btn', label);
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      parent.appendChild(link);
    }
    function fact(parent, label, value) {
      if (value == null || value === '') return;
      var item = el('div', 'music-fact');
      item.appendChild(el('small', null, label));
      item.appendChild(el('b', null, String(value)));
      parent.appendChild(item);
    }
    function setStatus(message, isError) {
      var status = $('[data-explore-status]', root);
      status.textContent = message || '';
      status.setAttribute('data-error', String(!!isError));
    }
    function setBusy(value) {
      busy = value;
      var button = $('[data-explore-submit]', root);
      button.disabled = value;
      button.textContent = value ? 'Searching…' : 'Search';
    }
    function renderBand(query, online, error) {
      var area = $('[data-explore-results]', root);
      area.innerHTML = '';
      var local = localBand(query);
      if (!online && !local) {
        setStatus(error ? 'The online service is unavailable right now. Try again in a moment.' : 'No band information found. Try a different spelling.', !!error);
        return;
      }
      var card = el('article', 'music-info-card');
      var heading = el('div', 'music-info-heading');
      heading.appendChild(el('h2', null, (online && online.title) || (local && local.n) || query));
      if (local && local.bio) heading.appendChild(el('p', 'music-description', local.bio));
      else if (online && online.description) heading.appendChild(el('p', 'music-description', online.description));
      card.appendChild(heading);
      if (online && online.image) {
        var image = el('img', 'music-cover');
        image.src = online.image;
        image.alt = 'Photo related to ' + ((online && online.title) || query);
        image.loading = 'lazy';
        card.appendChild(image);
      }
      if (local) {
        var facts = el('div', 'music-facts');
        fact(facts, local.type === 'artist' ? 'Active since' : 'Formed', local.y);
        fact(facts, 'Country', local.c);
        fact(facts, 'Genre', local.g);
        fact(facts, 'From', local.origin);
        fact(facts, 'Languages', local.languages);
        fact(facts, 'Songs in Yapin', local.s.length);
        card.appendChild(facts);
        var songs = el('div', 'music-catalog');
        songs.appendChild(el('h3', null, 'Songs in the Yapin Music catalog'));
        var list = el('ul');
        local.s.slice(0, 8).forEach(function (song) {
          list.appendChild(el('li', null, song[0] + ' · ' + song[1] + ' · ' + song[2]));
        });
        songs.appendChild(list);
        card.appendChild(songs);
      }
      if (online && online.extract) card.appendChild(el('p', 'music-extract', online.extract));
      if (online && online.url) addLink(card, online.url, 'Read full article on Wikipedia', 'btn');
      addLink(card, 'https://open.spotify.com/search/' + encodeURIComponent(query), 'Search on Spotify', 'btn');
      if (error) card.appendChild(el('p', 'music-muted', 'Wikipedia could not be reached, so only Yapin’s built-in catalog details are shown.'));
      area.appendChild(card);
      setStatus(online ? 'Band information from Wikipedia' : 'Showing Yapin Music catalog information');
    }
    function durationLabel(ms) {
      if (!ms) return '';
      var total = Math.round(ms / 1000);
      return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
    }
    function renderSongs(query, songs) {
      var area = $('[data-explore-results]', root);
      area.innerHTML = '';
      if (!songs.length) {
        setStatus('No matching songs were found in the Apple Music catalog. Try the title plus the artist name.', false);
        return;
      }
      songs.forEach(function (song) {
        var card = el('article', 'music-info-card song-info-card');
        var top = el('div', 'song-info-top');
        if (song.artwork) {
          var image = el('img', 'music-cover');
          image.src = song.artwork;
          image.alt = 'Album artwork for ' + song.title;
          image.loading = 'lazy';
          top.appendChild(image);
        }
        var info = el('div', 'song-info-copy');
        info.appendChild(el('h2', null, song.title));
        info.appendChild(el('p', 'music-description', song.artist));
        if (song.album) info.appendChild(el('p', 'music-muted', song.album));
        top.appendChild(info);
        card.appendChild(top);
        var facts = el('div', 'music-facts');
        fact(facts, 'Release date', song.releaseDate ? new Date(song.releaseDate).getFullYear() : '');
        fact(facts, 'Genre', song.genre);
        fact(facts, 'Duration', durationLabel(song.duration));
        card.appendChild(facts);
        if (song.url) addLink(card, song.url, 'View on Apple Music', 'btn primary');
        addLink(card, 'https://open.spotify.com/search/' + encodeURIComponent(song.title + ' ' + song.artist), 'Search on Spotify', 'btn');
        area.appendChild(card);
      });
      setStatus('Song and album details from Apple Music / iTunes');
    }
    function render() {
      root.innerHTML =
        '<div class="explorer">' +
          '<div class="explorer-head"><h1>Music Explorer</h1><p class="lede">Discover the stories behind bands, and explore songs, albums and release details.</p></div>' +
          '<div class="explorer-panel">' +
            '<div class="seg explorer-tabs" role="group" aria-label="Choose what to search">' +
              '<button type="button" data-explore-type="band" aria-pressed="true">Bands & artists</button>' +
              '<button type="button" data-explore-type="song" aria-pressed="false">Songs</button>' +
            '</div>' +
            '<form class="explore-search" data-explore-form>' +
              '<div class="explore-combo">' +
                '<input type="search" data-explore-input role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="explore-suggestions" placeholder="Search for a band or artist…" aria-label="Search music information" maxlength="120" autocomplete="off">' +
                '<ul class="explore-suggestions" id="explore-suggestions" role="listbox" aria-label="Music suggestions" hidden></ul>' +
              '</div>' +
              '<button class="btn primary" type="submit" data-explore-submit>Search</button>' +
            '</form>' +
            '<p class="music-muted">Start typing to see matching artists, bands and songs. Online searches run when you press Search. Results are cached on this device for 7 days.</p>' +
            '<p class="explore-status" data-explore-status role="status" aria-live="polite">Search for a band, artist or song to get started.</p>' +
            '<div class="explore-results" data-explore-results></div>' +
          '</div>' +
          '<p class="explore-credit">Band biographies are provided by Wikipedia. Song and album catalog details are supplied by Apple Music / iTunes Search.</p>' +
        '</div>';
      var input = $('[data-explore-input]', root);
      var exploreForm = $('[data-explore-form]', root);
      var suggestionList = $('#explore-suggestions', root);
      var allSuggestions = [];
      var visibleSuggestions = [];
      var activeSuggestion = -1;

      // Build one local suggestion index for both artists/bands and catalog songs.
      BANDS.forEach(function (band) {
        var bandKeys = [band.n].concat(band.aliases || []).map(bandKey);
        allSuggestions.push({
          type: 'band', value: band.n, label: band.n,
          detail: band.type === 'artist' ? 'Artist' : 'Band',
          keys: bandKeys
        });
        band.s.forEach(function (song) {
          allSuggestions.push({
            type: 'song', value: song[0], label: song[0],
            detail: band.n + ' · Song', keys: [key(song[0])]
          });
        });
      });

      function hideSuggestions() {
        suggestionList.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        activeSuggestion = -1;
      }
      function setSuggestionActive(index) {
        if (!visibleSuggestions.length) return;
        activeSuggestion = (index + visibleSuggestions.length) % visibleSuggestions.length;
        Array.prototype.forEach.call(suggestionList.children, function (item, itemIndex) {
          item.setAttribute('aria-selected', String(itemIndex === activeSuggestion));
        });
        input.setAttribute('aria-activedescendant', suggestionList.id + '-option-' + activeSuggestion);
      }
      function setExploreKind(nextKind, clearResults) {
        kind = nextKind;
        root.querySelectorAll('[data-explore-type]').forEach(function (tab) {
          tab.setAttribute('aria-pressed', String(tab.dataset.exploreType === kind));
        });
        input.placeholder = kind === 'band' ? 'Search for a band or artist…' : 'Search for a song…';
        if (clearResults) {
          input.value = '';
          $('[data-explore-results]', root).innerHTML = '';
          setStatus(kind === 'band' ? 'Search for a band or artist to read its story.' : 'Search for a song to explore its album and release details.');
        }
      }
      function chooseSuggestion(item) {
        setExploreKind(item.type, false);
        input.value = item.value;
        hideSuggestions();
        exploreForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
      function renderSuggestions() {
        var query = key(input.value);
        suggestionList.innerHTML = '';
        visibleSuggestions = [];
        activeSuggestion = -1;
        input.removeAttribute('aria-activedescendant');
        if (query.length < 2) { hideSuggestions(); return; }

        var ranked = [];
        allSuggestions.forEach(function (item) {
          var score = 0;
          item.keys.forEach(function (candidate) {
            if (!candidate) return;
            if (candidate === query) score = Math.max(score, 120);
            else if (candidate.indexOf(query) === 0) score = Math.max(score, 100);
            else if (query.length >= 3 && candidate.indexOf(query) > 0) score = Math.max(score, 70);
          });
          if (score) ranked.push({ item: item, score: score });
        });
        ranked.sort(function (a, b) {
          return b.score - a.score || (a.item.type === b.item.type ? 0 : (a.item.type === 'band' ? -1 : 1));
        });
        visibleSuggestions = ranked.slice(0, 8).map(function (entry) { return entry.item; });
        if (!visibleSuggestions.length) { hideSuggestions(); return; }

        visibleSuggestions.forEach(function (item, index) {
          var option = el('li', 'explore-suggestion');
          option.id = suggestionList.id + '-option-' + index;
          option.setAttribute('role', 'option');
          option.setAttribute('aria-selected', 'false');
          option.appendChild(el('span', 'explore-suggestion-name', item.label));
          option.appendChild(el('span', 'explore-suggestion-type', item.detail));
          option.addEventListener('pointerdown', function (event) {
            event.preventDefault();
            chooseSuggestion(item);
          });
          suggestionList.appendChild(option);
        });
        suggestionList.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      }

      input.addEventListener('input', renderSuggestions);
      input.addEventListener('focus', renderSuggestions);
      input.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown' && !suggestionList.hidden && visibleSuggestions.length) {
          event.preventDefault();
          setSuggestionActive(activeSuggestion + 1);
        } else if (event.key === 'ArrowUp' && !suggestionList.hidden && visibleSuggestions.length) {
          event.preventDefault();
          setSuggestionActive(activeSuggestion < 0 ? visibleSuggestions.length - 1 : activeSuggestion - 1);
        } else if (event.key === 'Escape') {
          hideSuggestions();
        } else if (event.key === 'Enter' && !suggestionList.hidden &&
          (activeSuggestion >= 0 || visibleSuggestions.length === 1)) {
          event.preventDefault();
          chooseSuggestion(visibleSuggestions[activeSuggestion >= 0 ? activeSuggestion : 0]);
        }
      });
      input.addEventListener('blur', function () {
        window.setTimeout(hideSuggestions, 140);
      });
      root.querySelectorAll('[data-featured-query]').forEach(function (button) {
        button.addEventListener('click', function () {
          setExploreKind('band', false);
          hideSuggestions();
          input.value = button.dataset.featuredQuery;
          exploreForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
      });
      exploreForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        hideSuggestions();
        if (busy) return;
        var query = input.value.trim();
        if (!query) { setStatus('Enter a band, artist or song name first.'); input.focus(); return; }
        setBusy(true);
        setStatus(kind === 'band' ? 'Looking up band information…' : 'Looking up song and album details…');
        try {
          if (kind === 'band') {
            var online = await searchBandInfo(query);
            renderBand(query, online, false);
          } else {
            var songs = await searchSongInfo(query);
            renderSongs(query, songs);
          }
        } catch (error) {
          if (kind === 'band') renderBand(query, null, error);
          else {
            $('[data-explore-results]', root).innerHTML = '';
            setStatus('The Apple Music search service is unavailable right now. Your game is unaffected; try again later.', true);
          }
        } finally {
          setBusy(false);
        }
      });
      root.querySelectorAll('[data-explore-type]').forEach(function (button) {
        button.addEventListener('click', function () {
          hideSuggestions();
          setExploreKind(button.dataset.exploreType, true);
        });
      });
    }
    return {
      ready: false,
      init: function () {
        if (!this.ready) { this.ready = true; render(); }
      }
    };
  }

  games.song = gameSong();
  games.band = gameBand();
  games.explore = musicExplorer();

  /* ============ TEAM ============ */

  (function renderTeam() {
    var list = $('#team-list');
    TEAM.forEach(function (tier) {
      var sec = el('section', 'tier' + (tier.role === 'Owner' ? ' owner' : ''));
      var info = el('div', 'tier-info');
      var h = el('h2', null, tier.role); h.appendChild(el('span', 'cnt', String(tier.members.length)));
      info.appendChild(h); info.appendChild(el('p', null, tier.info));
      var ul = el('ul', 'members');
      tier.members.forEach(function (m) {
        var li = el('li', 'member');
        var img = el('img'); img.src = m.avatar || ICON; img.alt = ''; img.width = 56; img.height = 56;
        if (m.profileUserId) {
          getPublicProfile(m.profileUserId).then(function (profile) {
            if (profile && profile.avatar_url) img.src = profile.avatar_url;
          }).catch(function (error) {
            console.warn('Could not sync the Site Developers profile picture.', error);
          });
        }
        var who = el('div', 'who');
        if (m.profileUserId) {
          var profileLink = el('a', 'nm team-profile-link', m.name);
          profileLink.href = '#player/' + encodeURIComponent(String(m.profileUserId)) + '?from=our-team';
          profileLink.title = 'View ' + m.name + '’s player profile';
          profileLink.setAttribute('aria-label', 'View ' + m.name + '’s player profile');
          who.appendChild(profileLink);
        } else {
          who.appendChild(el('div', 'nm', m.name));
        }
        who.appendChild(el('div', 'hd', m.handle));
        li.appendChild(img); li.appendChild(who); ul.appendChild(li);
      });
      if (!tier.members.length) ul.appendChild(el('li', 'vacant', 'No one in this role yet.'));
      sec.appendChild(info); sec.appendChild(ul); list.appendChild(sec);
    });
  })();

  /* ============ LEADERBOARD + PLAYER PROFILE ============ */

  function createLeaderboardUI() {
    var boardRoot = document.getElementById('v-leaderboard');
    var profileRoot = document.getElementById('v-profile');
    var profileBox = profileRoot && $('[data-profile-panel]', profileRoot);
    var boardBox = boardRoot && $('[data-lb-board]', boardRoot);
    var refreshButton = boardRoot && $('[data-lb-refresh]', boardRoot);
    var profileTrigger = document.getElementById('profile-trigger');
    var triggerAvatar = profileTrigger && $('[data-profile-trigger-avatar]', profileTrigger);
    var authMode = 'login';
    var accountState = getAccountState();
    var entries = [];
    var initialized = false;
    var loadingBoard = false;

    function field(labelText, type, placeholder, autocomplete) {
      var label = el('label', 'lb-field');
      label.appendChild(el('span', null, labelText));
      var input = el('input');
      input.type = type;
      input.placeholder = placeholder || '';
      input.autocomplete = autocomplete || 'off';
      input.required = true;
      label.appendChild(input);
      return { label: label, input: input };
    }

    function setMessage(node, message, isError) {
      node.textContent = message || '';
      node.dataset.error = isError ? 'true' : 'false';
    }

    function initials(name) {
      return String(name || 'Y').trim().charAt(0).toUpperCase() || 'Y';
    }

    function appendAvatarDecoration(container, profile) {
      if (!container || !profile || !profile.active_decoration_image) return;
      var overlay = el('img', 'profile-decoration-overlay');
      overlay.src = profile.active_decoration_image;
      overlay.alt = '';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.draggable = false;
      overlay.onerror = function () { overlay.remove(); };
      container.appendChild(overlay);
    }

    function updateHeaderProfile() {
      if (!triggerAvatar || !profileTrigger) return;
      triggerAvatar.innerHTML = '';
      var profile = accountState.profile;
      if (profile && profile.avatar_url) {
        var image = el('img', null);
        image.src = profile.avatar_url;
        image.alt = '';
        image.loading = 'lazy';
        image.onerror = function () {
          triggerAvatar.innerHTML = '';
          triggerAvatar.textContent = initials(profile.username);
        };
        triggerAvatar.appendChild(image);
      } else {
        triggerAvatar.textContent = profile ? initials(profile.username) : (accountState.user ? initials(accountState.user.name) : 'Y');
      }
      appendAvatarDecoration(triggerAvatar, profile);
      profileTrigger.title = accountState.user
        ? 'Open ' + ((profile && profile.username) || accountState.user.name || 'your') + ' profile'
        : 'Sign in or create your player profile';
      profileTrigger.setAttribute('aria-label', profileTrigger.title);
      profileTrigger.classList.toggle('has-account', Boolean(accountState.user));
    }

    function fileToDataUrl(file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result || '')); };
        reader.onerror = function () { reject(new Error('Your browser could not read this image.')); };
        reader.onabort = function () { reject(new Error('Image reading was cancelled.')); };
        reader.readAsDataURL(file);
      });
    }

    function renderProfile(nextState) {
      accountState = nextState || getAccountState();
      updateHeaderProfile();
      if (!profileBox) return;
      profileBox.innerHTML = '';

      if (!accountState.configured) {
        profileBox.appendChild(el('p', 'lb-muted', 'The player account service is not connected yet. You can still play every game as a guest.'));
        return;
      }
      if (accountState.loading) {
        profileBox.appendChild(el('p', 'lb-muted', 'Checking your player account…'));
        return;
      }

      if (!accountState.user) {
        profileBox.appendChild(el('p', 'lb-muted', 'Sign in with Yapin or use your email and password. You can keep playing as a guest without an account.'));
        var yapinLogin = el('button', 'btn yapin-login-button');
        yapinLogin.type = 'button';
        var yapinLogo = el('img', 'yapin-login-logo');
        yapinLogo.src = 'https://www.yapin.gg/favicon.ico';
        yapinLogo.alt = '';
        yapinLogo.setAttribute('aria-hidden', 'true');
        yapinLogo.decoding = 'async';
        yapinLogo.onerror = function () {
          if (!yapinLogo.dataset.fallback) {
            yapinLogo.dataset.fallback = 'true';
            yapinLogo.src = 'https://www.google.com/s2/favicons?domain=yapin.gg&sz=64';
          } else {
            yapinLogo.hidden = true;
          }
        };
        var yapinLoginLabel = el('span', null, 'Continue with Yapin');
        yapinLogin.appendChild(yapinLogo);
        yapinLogin.appendChild(yapinLoginLabel);
        yapinLogin.addEventListener('click', async function () {
          yapinLogin.disabled = true;
          yapinLoginLabel.textContent = 'Opening Yapin…';
          try {
            var authorizationUrl = await startYapinLogin();
            window.location.assign(authorizationUrl);
          } catch (error) {
            toast(error.message || 'Could not start Yapin sign-in.');
            yapinLogin.disabled = false;
            yapinLoginLabel.textContent = 'Continue with Yapin';
          }
        });
        profileBox.appendChild(yapinLogin);
        profileBox.appendChild(el('div', 'yapin-login-divider', 'OR CONTINUE WITH EMAIL'));
        var switcher = el('div', 'lb-auth-switch');
        var createButton = el('button', 'btn', 'Create account');
        createButton.type = 'button';
        createButton.setAttribute('aria-pressed', String(authMode === 'signup'));
        var loginButton = el('button', 'btn', 'Log in');
        loginButton.type = 'button';
        loginButton.setAttribute('aria-pressed', String(authMode === 'login'));
        createButton.addEventListener('click', function () { authMode = 'signup'; renderProfile(accountState); });
        loginButton.addEventListener('click', function () { authMode = 'login'; renderProfile(accountState); });
        switcher.appendChild(createButton);
        switcher.appendChild(loginButton);
        profileBox.appendChild(switcher);

        var authForm = el('form', 'lb-auth-form');
        var usernameField = field('Public player name', 'text', 'e.g. MusicNerd42', 'nickname');
        if (authMode === 'signup') authForm.appendChild(usernameField.label);
        var emailField = field('Email address', 'email', 'you@example.com', 'email');
        authForm.appendChild(emailField.label);
        var passwordField = field('Password', 'password', 'At least 6 characters', authMode === 'signup' ? 'new-password' : 'current-password');
        passwordField.input.minLength = 6;
        authForm.appendChild(passwordField.label);
        var authMessage = el('p', 'lb-message');
        authForm.appendChild(authMessage);
        var authSubmit = el('button', 'btn primary', authMode === 'signup' ? 'Create free account' : 'Log in');
        authSubmit.type = 'submit';
        authForm.appendChild(authSubmit);
        authForm.addEventListener('submit', async function (event) {
          event.preventDefault();
          authSubmit.disabled = true;
          setMessage(authMessage, authMode === 'signup' ? 'Creating your account…' : 'Signing you in…', false);
          try {
            if (authMode === 'signup') {
              var result = await signUp({
                username: usernameField.input.value,
                email: emailField.input.value,
                password: passwordField.input.value
              });
              if (result.confirmationPending) {
                setMessage(authMessage, 'Check your email for the confirmation link, then return here and log in.', false);
              } else {
                toast('Welcome to Yapin Music!');
                renderProfile(getAccountState());
                refresh();
              }
            } else {
              await signIn({ email: emailField.input.value, password: passwordField.input.value });
              toast('Welcome back!');
              renderProfile(getAccountState());
              refresh();
            }
          } catch (error) {
            setMessage(authMessage, error.message || 'Could not complete that request.', true);
          } finally {
            authSubmit.disabled = false;
          }
        });
        profileBox.appendChild(authForm);
        return;
      }

      var profile = accountState.profile || {};
      var summary = el('div', 'profile-editor-layout');
      var preview = el('section', 'profile-preview');
      setProfileAppearance(preview, profile);
      var cover = el('div', 'profile-cover');
      var coverImage = el('img', 'profile-cover-image');
      coverImage.alt = 'Profile banner preview';
      coverImage.hidden = !profile.banner_url;
      if (profile.banner_url) coverImage.src = profile.banner_url;
      var coverPlaceholder = el('div', 'profile-cover-placeholder', 'YAPIN MUSIC');
      coverPlaceholder.hidden = Boolean(profile.banner_url);
      cover.appendChild(coverImage);
      cover.appendChild(coverPlaceholder);
      var bannerPicker = el('input', 'profile-file-input');
      bannerPicker.type = 'file';
      bannerPicker.accept = '.png,.apng,.jpg,.jpeg,.webp,.gif,image/png,image/apng,image/jpeg,image/webp,image/gif';
      bannerPicker.setAttribute('aria-label', 'Choose a profile banner from your computer');
      var bannerEditButton = el('label', 'profile-image-edit profile-banner-edit', 'Change banner');
      bannerEditButton.appendChild(bannerPicker);
      cover.appendChild(bannerEditButton);
      preview.appendChild(cover);

      var identity = el('div', 'profile-preview-identity');
      var avatarWrap = el('div', 'profile-preview-avatar');
      avatarWrap.dataset.avatarShape = safeProfileChoice(profile.avatar_shape, ['circle', 'rounded', 'square'], 'rounded');
      var avatarImage = el('img');
      avatarImage.alt = 'Profile picture preview';
      avatarImage.hidden = !profile.avatar_url;
      if (profile.avatar_url) avatarImage.src = profile.avatar_url;
      var avatarFallback = el('span', null, initials(profile.username || accountState.user.name));
      avatarFallback.hidden = Boolean(profile.avatar_url);
      avatarWrap.appendChild(avatarImage);
      avatarWrap.appendChild(avatarFallback);
      appendAvatarDecoration(avatarWrap, profile);
      var avatarPicker = el('input', 'profile-file-input');
      avatarPicker.type = 'file';
      avatarPicker.accept = '.png,.apng,.jpg,.jpeg,.webp,.gif,image/png,image/apng,image/jpeg,image/webp,image/gif';
      avatarPicker.setAttribute('aria-label', 'Choose a profile picture from your computer');
      var avatarEditButton = el('label', 'profile-image-edit profile-avatar-edit', 'Edit');
      avatarEditButton.appendChild(avatarPicker);
      avatarWrap.appendChild(avatarEditButton);
      identity.appendChild(avatarWrap);
      var previewText = el('div', 'profile-preview-text');
      previewText.appendChild(el('strong', 'profile-preview-name', profile.username || accountState.user.name || 'Your player name'));
      var decorationShortcut = el('a', 'profile-decoration-inline-link', 'Choose an avatar decoration');
      decorationShortcut.href = '#decorations';
      previewText.appendChild(decorationShortcut);
      if (profile.artist_badge) previewText.appendChild(el('span', 'artist-badge', '✦ Artist'));
      previewText.appendChild(el('span', 'profile-preview-rank', (profile.rank_position ? '#' + profile.rank_position + ' · ' : '') + rankFor(profile.total_points || 0).name));
      identity.appendChild(previewText);
      preview.appendChild(identity);
      var decorationLink = el('a', 'btn profile-decoration-manage', 'Change avatar decoration');
      decorationLink.href = '#decorations';
      preview.appendChild(decorationLink);
      var previewTagline = el('p', 'profile-preview-tagline', profile.tagline || 'Your one-line status will appear here.');
      preview.appendChild(previewTagline);
      var previewBio = el('p', 'profile-preview-bio', profile.bio || 'Your bio will appear here. Tell the community a little about yourself.');
      preview.appendChild(previewBio);

      var totalPoints = Math.max(0, Number(profile.total_points) || 0);
      var currentRank = rankFor(totalPoints);
      var pointsCard = el('section', 'profile-points-card');
      var pointsHeading = el('div', 'profile-points-heading');
      var pointsTitle = el('div', 'profile-points-copy');
      pointsTitle.appendChild(el('span', 'profile-points-kicker', 'YOUR POINTS'));
      pointsTitle.appendChild(el('strong', 'profile-points-total', totalPoints.toLocaleString()));
      pointsTitle.appendChild(el('small', 'profile-points-caption', 'Total points earned'));
      pointsHeading.appendChild(pointsTitle);
      pointsHeading.appendChild(el('span', 'profile-points-rank', currentRank.name));
      pointsCard.appendChild(pointsHeading);

      var progressTrack = el('div', 'profile-points-track');
      var progressFill = el('span');
      progressFill.style.width = currentRank.progress + '%';
      progressTrack.appendChild(progressFill);
      pointsCard.appendChild(progressTrack);
      var progressText = currentRank.next
        ? (currentRank.next - totalPoints).toLocaleString() + ' points to ' + currentRank.nextName
        : 'Highest rank unlocked';
      pointsCard.appendChild(el('p', 'profile-points-next', progressText));

      var careerStats = el('div', 'profile-career-stats');
      [
        ['Wins', Number(profile.wins) || 0],
        ['Games played', Number(profile.games_played) || 0],
        ['Leaderboard', profile.rank_position ? '#' + profile.rank_position : 'Unranked']
      ].forEach(function (stat) {
        var item = el('div', 'profile-career-stat');
        item.appendChild(el('span', null, stat[0]));
        item.appendChild(el('strong', null, String(stat[1])));
        careerStats.appendChild(item);
      });
      pointsCard.appendChild(careerStats);
      preview.appendChild(pointsCard);
      summary.appendChild(preview);

      var editor = el('form', 'profile-editor');
      editor.appendChild(el('div', 'profile-editor-heading', 'EDIT YOUR PLAYER CARD'));
      var usernameField = field('Public player name', 'text', 'Your leaderboard name', 'nickname');
      usernameField.input.value = profile.username || accountState.user.name || '';
      editor.appendChild(usernameField.label);

      var bioLabel = el('label', 'lb-field');
      bioLabel.appendChild(el('span', null, 'Bio'));
      var bioInput = el('textarea', 'profile-bio-input');
      bioInput.maxLength = 160;
      bioInput.rows = 3;
      bioInput.placeholder = 'A little about you…';
      bioInput.value = profile.bio || '';
      bioLabel.appendChild(bioInput);
      editor.appendChild(bioLabel);
      editor.appendChild(el('p', 'profile-char-count', (bioInput.value.length) + '/160 characters'));

      var taglineField = field('One-line status', 'text', 'e.g. Always chasing the next great riff', 'off');
      taglineField.input.required = false;
      taglineField.input.maxLength = 60;
      taglineField.input.value = profile.tagline || '';
      editor.appendChild(taglineField.label);
      editor.appendChild(el('p', 'profile-image-help', 'Add a short status, then personalise the colours and style of your player card.'));

      var accentLabel = el('label', 'lb-field');
      accentLabel.appendChild(el('span', null, 'Accent colour'));
      var accentControls = el('div', 'profile-color-controls');
      var accentInput = el('input', 'profile-color-input');
      accentInput.type = 'color';
      accentInput.value = safeProfileColor(profile.accent_color);
      accentInput.setAttribute('aria-label', 'Choose a custom profile accent colour');
      accentControls.appendChild(accentInput);
      var swatches = el('div', 'profile-color-swatches');
      ['#FF6B35', '#7C5CFC', '#22A699', '#E34C8C', '#D5A13C', '#4388E8'].forEach(function (color) {
        var swatch = el('button', 'profile-color-swatch');
        swatch.type = 'button';
        swatch.style.backgroundColor = color;
        swatch.title = color;
        swatch.setAttribute('aria-label', 'Use accent colour ' + color);
        swatch.addEventListener('click', function () { accentInput.value = color; updatePreview(); });
        swatches.appendChild(swatch);
      });
      accentControls.appendChild(swatches);
      accentLabel.appendChild(accentControls);
      editor.appendChild(accentLabel);

      function selectField(labelText, options, selectedValue) {
        var label = el('label', 'lb-field');
        label.appendChild(el('span', null, labelText));
        var select = el('select', 'profile-select');
        options.forEach(function (option) {
          var item = el('option', null, option[1]);
          item.value = option[0];
          select.appendChild(item);
        });
        select.value = selectedValue;
        label.appendChild(select);
        return { label: label, input: select };
      }
      var appearanceFields = el('div', 'profile-style-fields');
      var cardStyleField = selectField('Card theme', [
        ['classic', 'Classic'], ['sunset', 'Sunset'], ['ocean', 'Ocean'], ['aurora', 'Aurora'], ['midnight', 'Midnight']
      ], safeProfileChoice(profile.card_style, ['classic', 'sunset', 'ocean', 'aurora', 'midnight'], 'classic'));
      var avatarShapeField = selectField('Avatar shape', [
        ['circle', 'Circle'], ['rounded', 'Rounded'], ['square', 'Square']
      ], safeProfileChoice(profile.avatar_shape, ['circle', 'rounded', 'square'], 'rounded'));
      var effectField = selectField('Profile effect', [
        ['none', 'None'], ['glow', 'Glow'], ['shimmer', 'Shimmer']
      ], safeProfileChoice(profile.profile_effect, ['none', 'glow', 'shimmer'], 'none'));
      appearanceFields.appendChild(cardStyleField.label);
      appearanceFields.appendChild(avatarShapeField.label);
      appearanceFields.appendChild(effectField.label);
      editor.appendChild(appearanceFields);

      var compressionBox = el('div', 'profile-compression-status');
      compressionBox.hidden = true;
      editor.appendChild(compressionBox);
      var selectedAvatarFile = null;
      var selectedBannerFile = null;
      var avatarPreviewSource = profile.avatar_url || '';
      var bannerPreviewSource = profile.banner_url || '';
      var avatarObjectUrl = null;
      var bannerObjectUrl = null;
      var compressingImage = false;

      function setCompressionStatus(state) {
        compressionBox.hidden = false;
        compressionBox.innerHTML = '';
        compressionBox.className = 'profile-compression-status ' + (state.phase === 'error' ? 'is-error' : (state.phase === 'done' ? 'is-done' : 'is-active'));
        var top = el('div', 'profile-compression-top');
        top.appendChild(el('strong', null, state.phase === 'error' ? 'Image upload problem' : (state.phase === 'done' ? 'Image ready' : 'Compressing on this device…')));
        top.appendChild(el('span', null, Math.round(state.progress || 0) + '%'));
        compressionBox.appendChild(top);
        var track = el('div', 'profile-compression-track');
        var fill = el('span');
        fill.style.width = Math.max(3, Math.min(100, Number(state.progress) || 0)) + '%';
        track.appendChild(fill);
        compressionBox.appendChild(track);
        compressionBox.appendChild(el('p', null, state.message || ''));
        if (state.originalSize != null) {
          compressionBox.appendChild(el('small', null,
            'Original: ' + formatMediaBytes(state.originalSize) + ' · Final: ' +
            formatMediaBytes(state.outputSize == null ? state.originalSize : state.outputSize) +
            (state.savedBytes > 0 ? ' · Saved ' + formatMediaBytes(state.savedBytes) : '')
          ));
        }
      }

      function revokeObjectUrl(kind) {
        if (kind === 'avatar' && avatarObjectUrl) {
          URL.revokeObjectURL(avatarObjectUrl);
          avatarObjectUrl = null;
        }
        if (kind === 'banner' && bannerObjectUrl) {
          URL.revokeObjectURL(bannerObjectUrl);
          bannerObjectUrl = null;
        }
      }

      function updateLiveHeaderAvatar(source) {
        if (!triggerAvatar) return;
        triggerAvatar.innerHTML = '';
        if (source) {
          var headerImage = el('img');
          headerImage.src = source;
          headerImage.alt = '';
          headerImage.onerror = function () {
            triggerAvatar.innerHTML = '';
            triggerAvatar.textContent = initials(usernameField.input.value);
          };
          triggerAvatar.appendChild(headerImage);
        } else {
          triggerAvatar.textContent = initials(usernameField.input.value);
        }
      }

      function updatePreview() {
        previewText.querySelector('.profile-preview-name').textContent = usernameField.input.value.trim() || 'Your player name';
        previewBio.textContent = bioInput.value.trim() || 'Your bio will appear here. Tell the community a little about yourself.';
        previewTagline.textContent = taglineField.input.value.trim() || 'Your one-line status will appear here.';
        setProfileAppearance(preview, {
          accent_color: accentInput.value,
          card_style: cardStyleField.input.value,
          profile_effect: effectField.input.value
        });
        avatarWrap.dataset.avatarShape = avatarShapeField.input.value;
        var avatarUrl = avatarPreviewSource;
        avatarImage.hidden = !avatarUrl;
        avatarFallback.hidden = Boolean(avatarUrl);
        avatarFallback.textContent = initials(usernameField.input.value);
        if (avatarUrl) avatarImage.src = avatarUrl;
        var bannerUrl = bannerPreviewSource;
        coverImage.hidden = !bannerUrl;
        coverPlaceholder.hidden = Boolean(bannerUrl);
        if (bannerUrl) coverImage.src = bannerUrl;
        updateLiveHeaderAvatar(avatarUrl);
      }

      function normaliseProfileImageFile(file) {
        if (!file) return null;
        var extension = String(file.name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
        var types = { png:'image/png', apng:'image/apng', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp', gif:'image/gif' };
        var mime = /^image\/(png|apng|jpeg|webp|gif)$/i.test(file.type || '')
          ? String(file.type).toLowerCase()
          : (extension && types[extension[1]]);
        if (!mime) return null;
        if (file.type === mime) return file;
        return new File([file], file.name || 'profile-image.png', { type: mime, lastModified: file.lastModified || Date.now() });
      }

      function selectProfileImage(file, kind) {
        if (!file) return;
        file = normaliseProfileImageFile(file);
        if (!file) {
          setCompressionStatus({ phase: 'error', progress: 100, message: 'Choose a JPG, PNG, animated PNG, WebP or GIF image.' });
          toast('Please choose a supported image file.');
          return;
        }
        if (file.size > 20 * 1024 * 1024) {
          setCompressionStatus({ phase: 'error', progress: 100, message: 'Choose an image smaller than 20 MB.' });
          toast('Choose an image smaller than 20 MB.');
          return;
        }
        var isAvatar = kind === 'avatar';
        var objectUrl = URL.createObjectURL(file);
        revokeObjectUrl(kind);
        if (isAvatar) {
          selectedAvatarFile = file;
          avatarObjectUrl = objectUrl;
          avatarPreviewSource = objectUrl;
        } else {
          selectedBannerFile = file;
          bannerObjectUrl = objectUrl;
          bannerPreviewSource = objectUrl;
        }
        updatePreview();
        setCompressionStatus({
          phase: 'done',
          progress: 100,
          originalSize: file.size,
          outputSize: file.size,
          message: (isAvatar ? 'Profile photo' : 'Profile banner') + ' selected. Preview is live; animation will be preserved when you save.'
        });
      }
      async function compressSelectedImage(file, kind) {
        if (!file) return null;
        var isAvatar = kind === 'avatar';
        var maxStoredBytes = isAvatar ? 900 * 1024 : 1.2 * 1024 * 1024;
        var maxDataLength = isAvatar ? 1300000 : 1800000;
        var result = await compressMediaFile(file, {
          maxDimension: isAvatar ? 512 : 1800,
          cropSquare: isAvatar,
          quality: isAvatar ? 0.86 : 0.82,
          targetBytes: maxStoredBytes,
          onProgress: function (state) {
            setCompressionStatus({
              ...state,
              message: (isAvatar ? 'Profile photo · ' : 'Profile banner · ') + (state.message || '')
            });
          }
        });
        var chosen = result.file;
        if (!/^image\/(webp|png|apng|jpe?g|gif)$/i.test(chosen.type)) {
          throw new Error('This image format could not be prepared. Try a JPG or PNG image.');
        }
        if (chosen.size > maxStoredBytes) {
          throw new Error('After compression this image is still ' + formatMediaBytes(chosen.size) + '. Try a smaller image.');
        }
        var dataUrl = await fileToDataUrl(chosen);
        if (dataUrl.length > maxDataLength) {
          throw new Error('The compressed image is still too large. Try a smaller image.');
        }
        return dataUrl;
      }

      avatarPicker.addEventListener('change', function () {
        selectProfileImage(avatarPicker.files && avatarPicker.files[0], 'avatar');
      });
      bannerPicker.addEventListener('change', function () {
        selectProfileImage(bannerPicker.files && bannerPicker.files[0], 'banner');
      });
      usernameField.input.addEventListener('input', updatePreview);
      bioInput.addEventListener('input', function () {
        editor.querySelector('.profile-char-count').textContent = bioInput.value.length + '/160 characters';
        updatePreview();
      });
      taglineField.input.addEventListener('input', updatePreview);
      accentInput.addEventListener('input', updatePreview);
      cardStyleField.input.addEventListener('change', updatePreview);
      avatarShapeField.input.addEventListener('change', updatePreview);
      effectField.input.addEventListener('change', updatePreview);
      updatePreview();

      var saveMessage = el('p', 'lb-message');
      editor.appendChild(saveMessage);
      var actions = el('div', 'profile-editor-actions');
      var saveButton = el('button', 'btn primary', 'Save profile');
      saveButton.type = 'submit';
      actions.appendChild(saveButton);
      editor.appendChild(actions);
      editor.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (compressingImage) return;
        saveButton.disabled = true;
        compressingImage = true;
        try {
          var avatarData = null;
          var bannerData = null;
          if (selectedAvatarFile || selectedBannerFile) {
            setMessage(saveMessage, 'Compressing your images before upload…', false);
            if (selectedAvatarFile) avatarData = await compressSelectedImage(selectedAvatarFile, 'avatar');
            if (selectedBannerFile) bannerData = await compressSelectedImage(selectedBannerFile, 'banner');
          }
          setMessage(saveMessage, 'Saving your player card…', false);
          await saveProfileDetails({
            username: usernameField.input.value,
            bio: bioInput.value,
            tagline: taglineField.input.value,
            accentColor: accentInput.value,
            cardStyle: cardStyleField.input.value,
            avatarShape: avatarShapeField.input.value,
            profileEffect: effectField.input.value,
            avatarData: avatarData,
            bannerData: bannerData
          });
          setMessage(saveMessage, 'Your player card has been updated.', false);
          toast('Profile saved!');
          revokeObjectUrl('avatar');
          revokeObjectUrl('banner');
          selectedAvatarFile = null;
          selectedBannerFile = null;
          renderProfile(getAccountState());
          refresh();
        } catch (error) {
          setMessage(saveMessage, error.message || 'Could not save your profile.', true);
          setCompressionStatus({ phase: 'error', progress: 100, message: error.message || 'Could not save your profile.' });
        } finally {
          compressingImage = false;
          saveButton.disabled = false;
        }
      });
      summary.appendChild(editor);
      profileBox.appendChild(summary);

      var accountActions = el('div', 'profile-account-actions');
      var emailNote = el('p', 'lb-muted', accountState.user.provider === 'yapin'
        ? 'Signed in with Yapin · @' + (accountState.user.yapinUsername || 'Yapin user')
        : (accountState.user.email || 'Signed-in player'));
      accountActions.appendChild(emailNote);
      var logout = el('button', 'btn', 'Sign out');
      logout.type = 'button';
      logout.addEventListener('click', async function () {
        logout.disabled = true;
        try {
          await signOut();
          toast('Signed out. You can keep playing as a guest.');
          renderProfile(getAccountState());
        } catch (error) {
          toast(error.message || 'Could not sign out.');
        } finally { logout.disabled = false; }
      });
      accountActions.appendChild(logout);
      profileBox.appendChild(accountActions);
    }

    function renderBoard() {
      if (!boardBox) return;
      boardBox.innerHTML = '';
      if (!accountState.configured) {
        boardBox.appendChild(el('div', 'lb-empty', 'The global leaderboard will appear here after the Yapin Music database is connected.'));
        return;
      }
      if (!entries.length) {
        boardBox.appendChild(el('div', 'lb-empty', 'No ranked players yet. Win a Daily round while signed in to claim the first spot.'));
        return;
      }
      var list = el('div', 'lb-rows');
      entries.forEach(function (entry, index) {
        var position = Number(entry.rank_position) || (index + 1);
        var rank = rankFor(entry.total_points);
        var item = el('div', 'lb-row' + (position === 1 ? ' lb-first' : ''));
        var place = el('div', 'lb-place', '#' + position);
        item.appendChild(place);
        var personLink = entry.user_id ? el('a', 'lb-person-link') : el('div', 'lb-person-link');
        if (entry.user_id) {
          personLink.href = '#player/' + encodeURIComponent(String(entry.user_id));
          personLink.setAttribute('aria-label', 'View ' + entry.username + '’s player profile');
          personLink.title = 'View player profile';
        }
        var avatar = el('div', 'lb-row-avatar');
        if (entry.avatar_url) {
          var image = el('img');
          image.src = entry.avatar_url;
          image.alt = '';
          image.loading = 'lazy';
          image.onerror = function () { avatar.textContent = initials(entry.username); };
          avatar.appendChild(image);
        } else {
          avatar.textContent = initials(entry.username);
        }
        personLink.appendChild(avatar);
        var identity = el('div', 'lb-identity');
        identity.appendChild(el('strong', null, entry.username));
        identity.appendChild(el('small', null, (Number(entry.wins) || 0) + ' wins · ' + (Number(entry.games_played) || 0) + ' games · View profile'));
        personLink.appendChild(identity);
        item.appendChild(personLink);
        item.appendChild(el('span', 'lb-rank-tag', rank.name));
        var score = el('div', 'lb-score');
        score.appendChild(el('strong', null, String(Number(entry.total_points) || 0)));
        score.appendChild(el('small', null, 'points'));
        item.appendChild(score);
        list.appendChild(item);
      });
      boardBox.appendChild(list);
    }

    async function refresh() {
      if (!boardBox || loadingBoard) return;
      if (!isLeaderboardConfigured()) {
        entries = [];
        renderBoard();
        return;
      }
      loadingBoard = true;
      if (refreshButton) refreshButton.disabled = true;
      boardBox.classList.add('lb-refreshing');
      try {
        var results = await getLeaderboard({ limit: 100 });
        entries = results.entries || [];
        renderBoard();
      } catch (error) {
        boardBox.innerHTML = '';
        boardBox.appendChild(el('div', 'lb-empty', 'The leaderboard could not load yet. Check the database setup and try refreshing.'));
        console.warn('Leaderboard could not be loaded.', error);
      } finally {
        loadingBoard = false;
        boardBox.classList.remove('lb-refreshing');
        if (refreshButton) refreshButton.disabled = false;
      }
    }

    if (refreshButton) refreshButton.addEventListener('click', refresh);

    return {
      init: function () {
        if (!initialized) {
          initialized = true;
          subscribeAccount(function (state) {
            accountState = state;
            renderProfile(state);
            flushPendingLeaderboardScores();
          });
        }
        updateHeaderProfile();
        refresh();
      },
      refresh: refresh
    };
  }

  function createPublicProfileUI() {
    var root = document.getElementById('v-player-profile');
    var panel = root && $('[data-public-profile-panel]', root);
    var requestNumber = 0;

    function appendAvatarDecoration(container, profile) {
      if (!container || !profile || !profile.active_decoration_image) return;
      var overlay = el('img', 'profile-decoration-overlay');
      overlay.src = profile.active_decoration_image;
      overlay.alt = '';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.draggable = false;
      overlay.onerror = function () { overlay.remove(); };
      container.appendChild(overlay);
    }

    function initials(name) {
      return String(name || 'Y').trim().charAt(0).toUpperCase() || 'Y';
    }

    function render(profile) {
      if (!panel) return;
      panel.innerHTML = '';
      if (!profile) {
        panel.appendChild(el('div', 'lb-empty', 'This player profile could not be found.'));
        return;
      }

      var card = el('article', 'public-player-card');
      setProfileAppearance(card, profile);
      var banner = el('div', 'public-player-banner');
      if (profile.banner_url) {
        var bannerImage = el('img');
        bannerImage.src = profile.banner_url;
        bannerImage.alt = '';
        bannerImage.loading = 'lazy';
        bannerImage.onerror = function () { bannerImage.remove(); };
        banner.appendChild(bannerImage);
      }
      card.appendChild(banner);

      var content = el('div', 'public-player-content');
      var identity = el('div', 'public-player-identity');
      var avatar = el('div', 'public-player-avatar');
      avatar.dataset.avatarShape = safeProfileChoice(profile.avatar_shape, ['circle', 'rounded', 'square'], 'rounded');
      if (profile.avatar_url) {
        var avatarImage = el('img');
        avatarImage.src = profile.avatar_url;
        avatarImage.alt = '';
        avatarImage.loading = 'lazy';
        avatarImage.onerror = function () {
          avatarImage.remove();
          avatar.textContent = initials(profile.username);
        };
        avatar.appendChild(avatarImage);
      } else {
        avatar.textContent = initials(profile.username);
      }
      appendAvatarDecoration(avatar, profile);
      identity.appendChild(avatar);

      var nameBlock = el('div', 'public-player-name-block');
      nameBlock.appendChild(el('h2', null, profile.username || 'Yapin Player'));
      if (profile.artist_badge) nameBlock.appendChild(el('span', 'artist-badge', '✦ Artist'));
      var rank = rankFor(profile.total_points);
      var rankLine = rank.name;
      if (profile.rank_position) rankLine += ' · #' + profile.rank_position + ' on the leaderboard';
      nameBlock.appendChild(el('p', 'public-player-rank', rankLine));
      identity.appendChild(nameBlock);
      content.appendChild(identity);

      if (String(profile.tagline || '').trim()) {
        content.appendChild(el('p', 'public-player-tagline', String(profile.tagline).trim()));
      }
      var bio = el('p', 'public-player-bio', String(profile.bio || '').trim() || 'This player has not added a bio yet.');
      content.appendChild(bio);

      var stats = el('div', 'public-player-stats');
      [
        ['Points', Number(profile.total_points) || 0],
        ['Wins', Number(profile.wins) || 0],
        ['Games played', Number(profile.games_played) || 0]
      ].forEach(function (stat) {
        var block = el('div', 'public-player-stat');
        block.appendChild(el('span', null, stat[0]));
        block.appendChild(el('strong', null, String(stat[1])));
        stats.appendChild(block);
      });
      content.appendChild(stats);

      var creations = Array.isArray(profile.created_decorations) ? profile.created_decorations : [];
      if (creations.length) {
        var creationSection = el('section', 'public-player-creations');
        creationSection.appendChild(el('h3', null, 'Creations by ' + (profile.username || 'this artist')));
        creationSection.appendChild(el('p', 'public-player-creations-note', 'Approved avatar decorations from this artist. Try one on your own profile.'));
        var creationGrid = el('div', 'public-player-creations-grid');
        creations.forEach(function (item) {
          var creation = el('article', 'public-player-creation');
          var art = el('img');
          art.src = item.image_data;
          art.alt = item.name + ' avatar decoration';
          art.loading = 'lazy';
          creation.appendChild(art);
          creation.appendChild(el('strong', null, item.name));
          creation.appendChild(el('small', null, String(item.wearer_count || 0) + ' wearing'));
          var wearButton = el('button', 'btn primary', getAccountState().user ? 'Wear decoration' : 'Sign in to wear');
          wearButton.type = 'button';
          wearButton.addEventListener('click', async function () {
            if (!getAccountState().user) { location.hash = '#profile'; return; }
            wearButton.disabled = true;
            wearButton.textContent = 'Adding…';
            try {
              await wearCommunityDecoration(item.id);
              wearButton.textContent = 'Added to your avatar';
              toast('Decoration applied to your avatar!');
            } catch (error) {
              wearButton.disabled = false;
              wearButton.textContent = 'Wear decoration';
              toast(error.message || 'Could not wear this decoration.');
            }
          });
          creation.appendChild(wearButton);
          creationGrid.appendChild(creation);
        });
        creationSection.appendChild(creationGrid);
        content.appendChild(creationSection);
      }

      card.appendChild(content);
      panel.appendChild(card);
    }

    return {
      show: function (userId) {
        var currentRequest = ++requestNumber;
        if (!panel) return;
        panel.innerHTML = '';
        if (!userId) {
          panel.appendChild(el('div', 'lb-empty', 'This player profile link is invalid.'));
          return;
        }
        panel.appendChild(el('p', 'lb-muted', 'Loading player profile…'));
        getPublicProfile(userId).then(function (result) {
          if (currentRequest === requestNumber) render(result);
        }).catch(function (error) {
          if (currentRequest !== requestNumber) return;
          panel.innerHTML = '';
          panel.appendChild(el('div', 'lb-empty', error.message || 'Could not load this player profile. Please try again.'));
        });
      }
    };
  }

  function createTasksUI() {
    var root = document.getElementById('v-tasks');
    var accountState = getAccountState();
    var initialized = false;
    var loading = false;
    var snapshot = null;
    var errorMessage = '';

    function appendNotice(parent, message, actionLabel, href) {
      var panel = el('section', 'tasks-notice');
      panel.appendChild(el('p', null, message));
      if (actionLabel && href) {
        var link = el('a', 'btn primary', actionLabel);
        link.href = href;
        panel.appendChild(link);
      }
      parent.appendChild(panel);
    }

    function claim(type, missionId, button) {
      if (button.disabled) return;
      button.disabled = true;
      var oldLabel = button.textContent;
      button.textContent = 'Claiming…';
      claimDailyReward({ type: type, missionId: missionId }).then(async function (result) {
        toast('+' + result.points + ' points added!');
        snapshot = result.tasks || null;
        errorMessage = '';
        try { await getPlayerLeaderboardEntry(); } catch (profileError) {
          console.warn('Could not refresh the player profile after a reward claim.', profileError);
        }
        if (leaderboardUI) leaderboardUI.refresh();
        await refresh();
      }).catch(function (error) {
        toast(error.message || 'Could not claim this reward.');
        button.disabled = false;
        button.textContent = oldLabel;
      });
    }

    function render() {
      if (!root) return;
      root.innerHTML = '';
      var page = el('div', 'tasks-page');
      var head = el('div', 'tasks-page-head');
      var headCopy = el('div');
      headCopy.appendChild(el('p', 'lb-eyebrow', 'PLAY DAILY · EARN POINTS'));
      headCopy.appendChild(el('h1', null, 'Daily Tasks'));
      headCopy.appendChild(el('p', 'lede', 'Complete music missions and collect your free daily points. Every reward adds to your leaderboard total.'));
      head.appendChild(headCopy);
      var refreshButton = el('button', 'btn', 'Refresh tasks');
      refreshButton.type = 'button';
      refreshButton.disabled = loading;
      refreshButton.addEventListener('click', refresh);
      head.appendChild(refreshButton);
      page.appendChild(head);

      if (!accountState.configured) {
        appendNotice(page, 'Player accounts are not connected yet. Daily tasks and points need a signed-in account.', 'Open profile', '#profile');
      } else if (accountState.loading) {
        appendNotice(page, 'Checking your player account…');
      } else if (!accountState.user) {
        appendNotice(page, 'Sign in or create a free Yapin account to collect daily points and save your mission progress.', 'Sign in / create account', '#profile');
      } else if (!accountState.profile) {
        appendNotice(page, 'Set up your public player name before earning points on the leaderboard.', 'Set up profile', '#profile');
      } else if (loading && !snapshot) {
        appendNotice(page, 'Loading today’s missions…');
      } else if (errorMessage && !snapshot) {
        var errorPanel = el('section', 'tasks-notice');
        errorPanel.appendChild(el('p', null, errorMessage));
        var retry = el('button', 'btn primary', 'Try again');
        retry.type = 'button';
        retry.addEventListener('click', refresh);
        errorPanel.appendChild(retry);
        page.appendChild(errorPanel);
      } else if (snapshot) {
        var summary = el('div', 'tasks-summary');
        var balance = el('div', 'tasks-balance');
        balance.appendChild(el('span', null, 'YOUR POINTS'));
        balance.appendChild(el('strong', null, String(snapshot.totalPoints || 0)));
        balance.appendChild(el('small', null, 'Leaderboard total'));
        summary.appendChild(balance);
        var date = el('div', 'tasks-date');
        date.appendChild(el('span', null, 'TODAY’S RESET'));
        date.appendChild(el('strong', null, snapshot.date || 'Today'));
        date.appendChild(el('small', null, 'Daily rewards reset at midnight India time'));
        summary.appendChild(date);
        page.appendChild(summary);

        var bonus = el('section', 'task-free-card');
        var bonusCopy = el('div', 'task-free-copy');
        bonusCopy.appendChild(el('span', 'task-kicker', 'DAILY FREE POINTS'));
        bonusCopy.appendChild(el('h2', null, 'Your daily 25-point drop'));
        bonusCopy.appendChild(el('p', null, 'Collect a free reward once every day. No game required.'));
        bonus.appendChild(bonusCopy);
        var bonusAction = el('div', 'task-free-action');
        bonusAction.appendChild(el('strong', null, '+' + (snapshot.dailyBonus ? snapshot.dailyBonus.points : 25) + ' pts'));
        var bonusButton = el('button', snapshot.dailyBonus && snapshot.dailyBonus.claimed ? 'btn' : 'btn primary',
          snapshot.dailyBonus && snapshot.dailyBonus.claimed ? 'Collected today' : 'Claim free points');
        bonusButton.type = 'button';
        bonusButton.disabled = loading || Boolean(snapshot.dailyBonus && snapshot.dailyBonus.claimed);
        bonusButton.addEventListener('click', function () { claim('daily_bonus', null, bonusButton); });
        bonusAction.appendChild(bonusButton);
        bonus.appendChild(bonusAction);
        page.appendChild(bonus);

        page.appendChild(el('div', 'tasks-section-title', 'TODAY’S MISSIONS'));
        var grid = el('div', 'tasks-grid');
        (snapshot.missions || []).forEach(function (mission) {
          var card = el('article', 'task-card' + (mission.claimed ? ' is-claimed' : (mission.completed ? ' is-ready' : '')));
          var top = el('div', 'task-card-top');
          top.appendChild(el('span', 'task-status', mission.claimed ? 'CLAIMED' : (mission.completed ? 'READY TO CLAIM' : 'IN PROGRESS')));
          top.appendChild(el('strong', 'task-reward', '+' + mission.reward + ' pts'));
          card.appendChild(top);
          card.appendChild(el('h3', null, mission.title));
          card.appendChild(el('p', 'task-description', mission.description));
          var progress = el('div', 'task-progress');
          var track = el('div', 'task-progress-track');
          var fill = el('span');
          fill.style.width = Math.max(0, Math.min(100, (Number(mission.current) / Math.max(1, Number(mission.target))) * 100)) + '%';
          track.appendChild(fill);
          progress.appendChild(track);
          progress.appendChild(el('small', null, mission.current + ' / ' + mission.target + ' complete'));
          card.appendChild(progress);
          var action;
          if (mission.claimed) {
            action = el('button', 'btn', 'Reward collected');
            action.disabled = true;
          } else if (mission.completed) {
            action = el('button', 'btn primary', 'Claim +' + mission.reward + ' points');
            action.addEventListener('click', function () { claim('mission', mission.id, action); });
          } else {
            action = el('a', 'btn', 'Play a Daily game');
            action.href = '#song';
          }
          action.classList.add('task-card-action');
          card.appendChild(action);
          grid.appendChild(card);
        });
        page.appendChild(grid);
        page.appendChild(el('p', 'tasks-footnote', 'Daily missions count completed Daily and Random rounds. Each mission reward can be claimed once per day.'));
        if (errorMessage) page.appendChild(el('p', 'lb-message', errorMessage));
      }
      root.appendChild(page);
    }

    async function refresh() {
      if (!root || loading) return;
      if (!accountState.user || !accountState.profile || !isLeaderboardConfigured()) {
        snapshot = null;
        render();
        return;
      }
      loading = true;
      errorMessage = '';
      render();
      try {
        snapshot = await getDailyTasks();
      } catch (error) {
        errorMessage = error.message || 'Could not load daily missions.';
      } finally {
        loading = false;
        render();
      }
    }

    return {
      init: function () {
        if (!initialized) {
          initialized = true;
          subscribeAccount(function (state) {
            accountState = state;
            if (!state.user || !state.profile) {
              snapshot = null;
              render();
            } else if (!state.loading) {
              refresh();
            }
          });
        }
        render();
        refresh();
      },
      refresh: refresh
    };
  }

  var leaderboardUI = createLeaderboardUI();
  var publicProfileUI = createPublicProfileUI();
  var tasksUI = createTasksUI();
  var decorationsUI = createDecorationsUI();
  var adminUI = createAdminUI();
  var profileUI = leaderboardUI;
  subscribeAccount(function (state) { decorationsUI.onAccountChange(state); });
  initPresenceAndAdminLink();

  /* ============ ROUTES ============ */

  var VIEWS = ['home', 'song', 'band', 'explore', 'leaderboard', 'tasks', 'decorations', 'admin', 'profile', 'player-profile', 'our-team'];
  var mobileNavToggle = document.getElementById('mobile-nav-toggle');
  var mobileNav = document.getElementById('main-navigation');

  function closeMobileNav() {
    if (!mobileNavToggle || !mobileNav) return;
    mobileNav.classList.remove('is-open');
    mobileNavToggle.setAttribute('aria-expanded', 'false');
    mobileNavToggle.setAttribute('aria-label', 'Open navigation');
  }

  if (mobileNavToggle && mobileNav) {
    mobileNavToggle.addEventListener('click', function () {
      var opening = mobileNavToggle.getAttribute('aria-expanded') !== 'true';
      mobileNavToggle.setAttribute('aria-expanded', String(opening));
      mobileNavToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
      mobileNav.classList.toggle('is-open', opening);
    });
    mobileNav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMobileNav();
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.site-head')) closeMobileNav();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        closeMobileNav();
        mobileNavToggle.focus();
      }
    });
  }

  var publicProfileReturnRoute = 'leaderboard';

  function route() {
    closeMobileNav();
    var routeParts = location.hash.replace(/^#/, '').split('?');
    var hashRoute = routeParts[0];
    var routeQuery = new URLSearchParams(routeParts.slice(1).join('?'));
    var publicProfileId = '';
    var h = hashRoute;
    if (hashRoute.indexOf('player/') === 0) {
      h = 'player-profile';
      publicProfileReturnRoute = routeQuery.get('from') === 'our-team' ? 'our-team' : 'leaderboard';
      try { publicProfileId = decodeURIComponent(hashRoute.slice(7)); }
      catch (error) { publicProfileId = ''; }
    } else {
      publicProfileReturnRoute = 'leaderboard';
    }
    if (VIEWS.indexOf(h) < 0) h = 'home';
    var isPlayerOverlay = h === 'player-profile';
    VIEWS.forEach(function (v) {
      var keepBackgroundBehindOverlay = isPlayerOverlay && v === publicProfileReturnRoute;
      document.getElementById('v-' + v).hidden = v !== h && !keepBackgroundBehindOverlay;
    });
    var publicProfileClose = document.querySelector('.public-profile-close');
    if (publicProfileClose) publicProfileClose.href = '#' + publicProfileReturnRoute;
    document.body.classList.toggle('player-profile-open', isPlayerOverlay);
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      var navRoute = isPlayerOverlay ? publicProfileReturnRoute : h;
      if (a.dataset.nav === navRoute) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.getElementById('band').toggleAttribute('data-home', h === 'home');
    active = games[h] || null;
    if (active) active.init();
    if ((h === 'leaderboard' || h === 'profile' || isPlayerOverlay) && leaderboardUI) leaderboardUI.init();
    if (isPlayerOverlay && publicProfileUI) publicProfileUI.show(publicProfileId);
    if (h === 'tasks' && tasksUI) tasksUI.init();
    if (h === 'decorations' && decorationsUI) decorationsUI.init();
    if (h === 'admin' && adminUI) adminUI.init();
    if (queuedRandomGame === h && active && active.random) {
      active.random();
      queuedRandomGame = null;
    }
    if (!isPlayerOverlay) window.scrollTo(0, 0);
  }

  var publicProfileOverlay = document.getElementById('v-player-profile');
  if (publicProfileOverlay) {
    publicProfileOverlay.addEventListener('click', function (event) {
      if (event.target === publicProfileOverlay) location.hash = '#' + publicProfileReturnRoute;
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !publicProfileOverlay.hidden) {
        location.hash = '#' + publicProfileReturnRoute;
      }
    });
  }

  window.addEventListener('hashchange', route);
  route();

  async function handleYapinOAuthCallback() {
    var params = new URLSearchParams(window.location.search);
    var code = params.get('code');
    var state = params.get('state');
    var providerError = params.get('error');
    if (!code && !state && !providerError) return;

    // Remove the one-time OAuth response from the address bar before any API work.
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
    if (providerError) {
      toast(providerError === 'access_denied' ? 'Yapin sign-in was cancelled.' : 'Yapin could not sign you in. Please try again.');
      return;
    }
    if (!code || !state) {
      toast('The Yapin sign-in response was incomplete. Please try again.');
      return;
    }

    if (window.location.hash !== '#profile') window.location.hash = '#profile';
    try {
      await completeYapinLogin({ code: code, state: state });
      toast('Welcome to Yapin Music! You are signed in with Yapin.');
      leaderboardUI.init();
    } catch (error) {
      console.warn('Yapin sign-in could not be completed.', error);
      toast(error.message || 'Yapin sign-in failed. Please try again.');
      leaderboardUI.init();
    }
  }
  handleYapinOAuthCallback();
})();
