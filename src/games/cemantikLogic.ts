import {
  CEMANTIK_WORDS,
  getEntry,
  isKnownWord,
  normalizeWord,
  pickTarget,
  type TargetPool,
} from "./cemantikLexicon";

export type CemantikMode = "facile" | "dur" | "mondial" | "mystere";

export type GuessResult = {
  word: string;
  /** Proximité 0–100 (interne ; masquée en Mystère). */
  score: number;
  /** Rang parmi tes essais (1 = meilleur essai). */
  rank: number;
  /** Rang lexique 1…N (1 = plus proche du secret). Mystère s’en sert. */
  lexiconRank: number;
  known: boolean;
  found: boolean;
};

export type CemantikRound = {
  mode: CemantikMode;
  target: string;
  seed: number;
  guesses: GuessResult[];
  found: boolean;
};

export const MODE_META: Record<
  CemantikMode,
  { label: string; kind: "solo" | "multi"; blurb: string }
> = {
  facile: {
    label: "Facile",
    kind: "solo",
    blurb: "Solo · cibles concrètes, scores plus lisibles.",
  },
  dur: {
    label: "Dur",
    kind: "solo",
    blurb: "Solo · cibles abstraites, montée plus serrée.",
  },
  mondial: {
    label: "Mondial",
    kind: "multi",
    blurb: "Multi · mot du jour ultra dur, même cible pour tous.",
  },
  mystere: {
    label: "Mystère",
    kind: "solo",
    blurb: "Solo · aucun % : seulement le n° de classement lexique.",
  },
};

/** Seed journalier (UTC). */
export function dailySeed(date = new Date()): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return y * 10000 + m * 100 + d;
}

function poolFor(mode: CemantikMode): TargetPool {
  switch (mode) {
    case "facile":
      return "easy";
    case "dur":
    case "mystere":
      return "hard";
    case "mondial":
      return "world";
  }
}

function seedFor(mode: CemantikMode, freeSeed?: number): number {
  if (mode === "mondial") return dailySeed();
  if (freeSeed != null) return freeSeed;
  return (Date.now() ^ (Math.random() * 1e9)) >>> 0;
}

export function createRound(mode: CemantikMode, freeSeed?: number): CemantikRound {
  const seed = seedFor(mode, freeSeed);
  return {
    mode,
    target: pickTarget(seed, poolFor(mode)),
    seed,
    guesses: [],
    found: false,
  };
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatScore(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return round2(n)
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

/** Score brut 0–100 avant courbe de difficulté. */
function rawProximity(guessRaw: string, targetRaw: string): number {
  const guess = normalizeWord(guessRaw);
  const target = normalizeWord(targetRaw);
  if (!guess || !target) return 0;
  if (guess === target) return 100;

  const g = getEntry(guess);
  const t = getEntry(target);
  if (!g || !t) return 0;

  let score = jaccard(g.tags, t.tags) * 62;
  if (t.tags.includes(guess)) score += 18;
  if (g.tags.includes(target)) score += 12;

  const targetNeighbors = neighborWords(target, 2);
  const guessNeighbors = neighborWords(guess, 2);
  const shared = targetNeighbors.filter((w) => guessNeighbors.includes(w));
  score += Math.min(16, shared.length * 2.8);

  if (guess.length >= 4 && target.length >= 4) {
    if (guess.slice(0, 3) === target.slice(0, 3)) score += 3.5;
    if (guess.slice(-3) === target.slice(-3)) score += 2.5;
  }

  const h = hashPair(guess, target);
  score += ((h % 701) - 350) / 100;
  const fine = ((h >>> 8) % 97) / 100;
  return Math.min(99.99, Math.max(0.01 + fine * 0.15, score));
}

/** Applique la courbe : Facile plus doux, Dur serré, Mondial ultra serré. */
export function applyDifficultyCurve(raw: number, mode: CemantikMode): number {
  if (raw >= 100) return 100;
  const x = Math.max(0, Math.min(1, raw / 100));
  let y: number;
  switch (mode) {
    case "facile":
      y = Math.pow(x, 0.72);
      break;
    case "dur":
      y = Math.pow(x, 1.4);
      break;
    case "mondial":
      y = Math.pow(x, 2.05);
      break;
    case "mystere":
      y = x; // non affiché, sert au rang
      break;
  }
  return round2(Math.min(99.99, Math.max(0.01, y * 100)));
}

export function proximityScore(
  guessRaw: string,
  targetRaw: string,
  mode: CemantikMode = "dur",
): number {
  return applyDifficultyCurve(rawProximity(guessRaw, targetRaw), mode);
}

/** Rang 1 = plus proche du secret dans tout le lexique. */
export function lexiconRankOf(guessRaw: string, targetRaw: string): number {
  const guess = normalizeWord(guessRaw);
  const target = normalizeWord(targetRaw);
  if (!guess || guess === target) return 1;

  const my = rawProximity(guess, target);
  let better = 0;
  for (const w of CEMANTIK_WORDS) {
    if (w === guess) continue;
    const s = rawProximity(w, target);
    if (s > my || (s === my && w.localeCompare(guess, "fr") < 0)) better += 1;
  }
  return better + 1;
}

function neighborWords(word: string, minShared: number): string[] {
  const e = getEntry(word);
  if (!e) return [];
  const tags = new Set(e.tags);
  const out: string[] = [];
  for (const w of CEMANTIK_WORDS) {
    if (w === word) continue;
    const o = getEntry(w);
    if (!o) continue;
    let n = 0;
    for (const t of o.tags) if (tags.has(t)) n += 1;
    if (n >= minShared) out.push(w);
  }
  return out;
}

function hashPair(a: string, b: string): number {
  let h = 2166136261;
  const s = `${a}|${b}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type SubmitOutcome =
  | { ok: true; round: CemantikRound; result: GuessResult }
  | { ok: false; reason: "empty" | "unknown" | "duplicate" | "done" };

export function submitGuess(round: CemantikRound, raw: string): SubmitOutcome {
  if (round.found) return { ok: false, reason: "done" };
  const word = normalizeWord(raw);
  if (!word) return { ok: false, reason: "empty" };
  if (!isKnownWord(word)) return { ok: false, reason: "unknown" };
  if (round.guesses.some((g) => g.word === word)) return { ok: false, reason: "duplicate" };

  const score = proximityScore(word, round.target, round.mode);
  const found = score >= 100 || word === round.target;
  const lexiconRank = lexiconRankOf(word, round.target);

  const result: GuessResult = {
    word,
    score: found ? 100 : score,
    rank: 0,
    lexiconRank: found ? 1 : lexiconRank,
    known: true,
    found,
  };

  const guesses = [...round.guesses, result];
  // Tri : Mystère par rang lexique (asc), sinon par score (desc)
  if (round.mode === "mystere") {
    guesses.sort(
      (a, b) => a.lexiconRank - b.lexiconRank || a.word.localeCompare(b.word, "fr"),
    );
  } else {
    guesses.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word, "fr"));
  }
  const ranked = guesses.map((g, i) => ({ ...g, rank: i + 1 }));

  return {
    ok: true,
    result: ranked.find((g) => g.word === word)!,
    round: {
      ...round,
      guesses: ranked,
      found,
    },
  };
}

export function relayScore(round: CemantikRound): number {
  const attempts = round.guesses.length;
  const best = round.guesses[0]?.score ?? 0;
  const modeBonus =
    round.mode === "mondial" ? 400 : round.mode === "mystere" ? 250 : round.mode === "dur" ? 120 : 0;
  if (round.found) {
    return Math.max(80, 2000 + modeBonus - attempts * 55 + Math.floor(best * 2));
  }
  if (round.mode === "mystere") {
    const bestRank = round.guesses[0]?.lexiconRank ?? CEMANTIK_WORDS.length;
    return Math.max(0, Math.floor(800 - bestRank * 0.35));
  }
  return Math.floor(best * 8.5);
}

export function lexiconSize(): number {
  return CEMANTIK_WORDS.length;
}
