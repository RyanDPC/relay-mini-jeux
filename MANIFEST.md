# RELAY recovery MANIFEST

Recovered from cloud agent transcript `bc-01a0d729-a86e-724f-a708-67df97edba2b` into `/agent/relay-recovered`.

Method: chronological replay of `search_replace` unified diffs from the transcript, seeded with a Vite `react-ts` scaffold for untouched config files; full (non-truncated) `read_file` snapshots used as checkpoints; secrets stripped from env samples.

**Files:** 79 (including this MANIFEST)  
**Total bytes:** 353068

## Confidence legend

- **high** — exact or near-exact replay from Write/StrReplace payloads (and/or matching full reads)
- **medium** — replayed with fallbacks, regenerated lockfile, or small intentional consistency fixes
- **low** — weak provenance / best-effort

## Files

| Path | Bytes | Confidence | Notes |
|---|---:|---|---|
| `.env.example` | 264 | high | 2 transcript edit(s) |
| `.gitignore` | 279 | high | 1 transcript edit(s); last full read @239 |
| `.oxlintrc.json` | 245 | high | vite react-ts scaffold + deps from transcript package.json/npm installs |
| `README.md` | 846 | high | 3 transcript edit(s), chronological replay |
| `index.html` | 851 | high | 1 transcript edit(s) |
| `package-lock.json` | 48366 | medium | regenerated via npm install during recovery validation |
| `package.json` | 630 | high | from transcript read + @supabase/supabase-js, react-router-dom, playwright |
| `public/favicon.svg` | 215 | high | 1 transcript edit(s), chronological replay |
| `scripts/demo-card-faces.mjs` | 2153 | high | 1 transcript edit(s); last full read @1547 |
| `scripts/demo-cemantik.mjs` | 2982 | high | 1 transcript edit(s), chronological replay |
| `scripts/demo-echo-classement.mjs` | 1918 | high | 1 transcript edit(s), chronological replay |
| `scripts/demo-friends-scores.mjs` | 3027 | high | 7 transcript edit(s), chronological replay |
| `scripts/demo-new-games.mjs` | 5880 | high | 1 transcript edit(s); last full read @1545 |
| `scripts/demo-recovery.mjs` | 1873 | high | 1 transcript edit(s), chronological replay |
| `scripts/demo-social-features.mjs` | 3610 | high | 1 transcript edit(s), chronological replay |
| `src/App.tsx` | 2324 | high | 5 transcript edit(s); last full read @1139 |
| `src/components/Shell.css` | 3919 | high | 5 transcript edit(s), chronological replay |
| `src/components/Shell.tsx` | 2784 | high | 5 transcript edit(s); last full read @1031 |
| `src/components/TouchPad.css` | 913 | high | 1 transcript edit(s), chronological replay |
| `src/components/TouchPad.tsx` | 1382 | high | 1 transcript edit(s); last full read @809 |
| `src/games/AshCircuit.tsx` | 6914 | high | 5 transcript edit(s), chronological replay |
| `src/games/Blackjack.tsx` | 5531 | high | 2 transcript edit(s), chronological replay |
| `src/games/CardLab.tsx` | 1616 | high | 1 transcript edit(s), chronological replay |
| `src/games/Cards.css` | 13697 | high | 29 transcript edit(s); last full read @924 |
| `src/games/Cemantik.css` | 4294 | high | 4 transcript edit(s) |
| `src/games/Cemantik.tsx` | 5784 | high | 4 transcript edit(s); last full read @1650 |
| `src/games/DriftBreaker.tsx` | 5458 | high | 4 transcript edit(s), chronological replay |
| `src/games/EchoMemory.tsx` | 3205 | high | 4 transcript edit(s); last full read @1440 |
| `src/games/PlayingCard.tsx` | 4216 | high | 8 transcript edit(s); last full read @1171 |
| `src/games/PulseSnake.tsx` | 4986 | medium | 10 edits with some hunk fallbacks; build passes |
| `src/games/Solitaire.tsx` | 7791 | high | 7 transcript edit(s), chronological replay |
| `src/games/SplitVoltage.tsx` | 7113 | high | 4 transcript edit(s), chronological replay |
| `src/games/UndercoverGame.tsx` | 7310 | high | 1 transcript edit(s), chronological replay |
| `src/games/UnoCardView.tsx` | 2147 | high | 2 transcript edit(s), chronological replay |
| `src/games/UnoGame.tsx` | 10667 | high | 5 transcript edit(s), chronological replay |
| `src/games/WerewolfGame.tsx` | 11094 | high | 1 transcript edit(s), chronological replay |
| `src/games/ashCircuitLogic.ts` | 9512 | high | 1 transcript edit(s); last full read @1009 |
| `src/games/cards.ts` | 1719 | high | 1 transcript edit(s); last full read @926 |
| `src/games/cemantikLexicon.ts` | 15326 | high | 2 transcript edit(s) |
| `src/games/cemantikLogic.ts` | 7876 | high | 5 transcript edit(s); last full read @1652 |
| `src/games/splitVoltageLogic.ts` | 8840 | high | 1 transcript edit(s); last full read @1011 |
| `src/games/useCanvasFit.ts` | 1230 | high | 3 transcript edit(s), chronological replay |
| `src/lib/AuthContext.tsx` | 6369 | high | 5 transcript edit(s); last full read @197 |
| `src/lib/PresenceContext.tsx` | 2531 | high | 3 transcript edit(s), chronological replay |
| `src/lib/api.ts` | 14346 | high | 4 transcript edit(s), chronological replay |
| `src/lib/demoStore.ts` | 6789 | high | 4 transcript edit(s), chronological replay |
| `src/lib/games.ts` | 2720 | high | 6 transcript edit(s); last full read @1447 |
| `src/lib/supabase.ts` | 1421 | high | 3 transcript edit(s); last full read @195 |
| `src/lib/types.ts` | 1713 | high | 6 transcript edit(s); last full read @1449 |
| `src/main.tsx` | 239 | high | 1 transcript edit(s) |
| `src/pages/Auth.css` | 1416 | high | 3 transcript edit(s), chronological replay |
| `src/pages/Auth.tsx` | 7518 | medium | replayed from transcript; Shell wrappers removed to match final ShellLayout+Outlet (intended, missing in edit log) |
| `src/pages/Chat.css` | 2567 | high | 1 transcript edit(s), chronological replay |
| `src/pages/Chat.tsx` | 5697 | medium | replayed from transcript; Shell wrappers removed to match final ShellLayout+Outlet (intended, missing in edit log) |
| `src/pages/Friends.css` | 1487 | high | 2 transcript edit(s), chronological replay |
| `src/pages/Friends.tsx` | 5827 | medium | replayed from transcript; Shell wrappers removed to match final ShellLayout+Outlet (intended, missing in edit log) |
| `src/pages/Hub.css` | 1824 | high | 2 transcript edit(s), chronological replay |
| `src/pages/Hub.tsx` | 1543 | high | 6 transcript edit(s); last full read @1471 |
| `src/pages/Landing.css` | 1824 | high | 1 transcript edit(s), chronological replay |
| `src/pages/Landing.tsx` | 1080 | medium | replayed from transcript; Shell wrappers removed to match final ShellLayout+Outlet (intended, missing in edit log) |
| `src/pages/Party.css` | 1581 | high | 1 transcript edit(s), chronological replay |
| `src/pages/Party.tsx` | 10048 | medium | replayed from transcript; Shell wrappers removed to match final ShellLayout+Outlet (intended, missing in edit log) |
| `src/pages/Play.css` | 4946 | high | 7 transcript edit(s); last full read @1024 |
| `src/pages/Play.tsx` | 5207 | high | 10 transcript edit(s); last full read @1451 |
| `src/pages/Profile.css` | 905 | high | 1 transcript edit(s), chronological replay |
| `src/pages/Profile.tsx` | 3268 | medium | replayed from transcript; Shell wrappers removed to match final ShellLayout+Outlet (intended, missing in edit log) |
| `src/styles/global.css` | 2296 | high | 1 transcript edit(s), chronological replay |
| `src/vite-env.d.ts` | 207 | high | 1 transcript edit(s) |
| `supabase/functions/username-auth/index.ts` | 7789 | high | 2 transcript edit(s); last full read @414 |
| `supabase/migrations/20260325060000_relay_core.sql` | 4648 | high | 2 transcript edit(s); last full read @162 |
| `supabase/migrations/20260325070000_relay_social_realtime.sql` | 2422 | high | 1 transcript edit(s) |
| `supabase/migrations/20260325100000_expand_game_ids.sql` | 383 | high | 1 transcript edit(s); last full read @1464 |
| `supabase/migrations/20260325110000_ash_split_game_ids.sql` | 374 | high | 1 transcript edit(s); last full read @1453 |
| `supabase/migrations/20260325120000_cemantik_game_id.sql` | 417 | high | 1 transcript edit(s) |
| `tsconfig.app.json` | 655 | high | vite react-ts scaffold + deps from transcript package.json/npm installs |
| `tsconfig.json` | 119 | high | vite react-ts scaffold + deps from transcript package.json/npm installs |
| `tsconfig.node.json` | 558 | high | vite react-ts scaffold + deps from transcript package.json/npm installs |
| `vite.config.ts` | 161 | high | vite react-ts scaffold + deps from transcript package.json/npm installs |

## Gaps / caveats

- `.env` with real secrets intentionally omitted (placeholders only in `.env.example`).
- `scripts/check-cemantik-hub.mjs` was created then deleted in the original session — not kept.
- Ephemeral demo helpers written under `/tmp` or later removed (`demo-cemantik-scale.mjs`, `_shot-cemantik-modes.mjs`) — not part of final tree.
- `supabase/.temp/cli-latest` left out (CLI cache junk).
- Page-level `<Shell>` wrappers were still present in transcript file payloads after `ShellLayout` migration; removed during recovery so `tsc -b` matches the intended final App router (see medium-confidence page files).
- Some mid-session `read_file` payloads in the transcript are truncated vs `totalLines`; recovery preferred chronological diffs and only used full reads as checkpoints.

## Cemantik (latest)

Recovered `cemantikLexicon.ts`, `cemantikLogic.ts`, `Cemantik.tsx`, `Cemantik.css` including modes **Facile / Dur / Mondial / Mystère**, proximity score **0–100**, and no `glacial` / `abandonner` strings.

## Validation

`npm install && npm run build` (`tsc -b && vite build`) succeeded on the recovered tree after Shell-wrapper cleanup (115 modules).
