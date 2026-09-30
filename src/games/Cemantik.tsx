import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  MODE_META,
  createRound,
  formatScore,
  lexiconSize,
  relayScore,
  submitGuess,
  type CemantikMode,
  type CemantikRound,
} from "./cemantikLogic";
import { CEMANTIK_WORDS } from "./cemantikLexicon";
import "./Cemantik.css";

type Props = {
  onScore: (score: number, final: boolean) => void;
};

const MODES: CemantikMode[] = ["facile", "dur", "mondial", "mystere"];

export function Cemantik({ onScore }: Props) {
  const [round, setRound] = useState<CemantikRound>(() => createRound("facile"));
  const [draft, setDraft] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mode = round.mode;
  const meta = MODE_META[mode];
  const mystery = mode === "mystere";
  const score = useMemo(() => relayScore(round), [round]);
  const best = round.guesses[0];

  useEffect(() => {
    onScore(score, round.found);
  }, [score, round.found, onScore]);

  const start = (next: CemantikMode) => {
    setRound(createRound(next));
    setDraft("");
    setFlash(null);
    onScore(0, false);
    inputRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const out = submitGuess(round, draft);
    if (!out.ok) {
      const msg =
        out.reason === "unknown"
          ? "Mot hors lexique RELAY."
          : out.reason === "duplicate"
            ? "Déjà proposé."
            : out.reason === "done"
              ? "Mot déjà trouvé."
              : "Entre un mot.";
      setFlash(msg);
      return;
    }
    setRound(out.round);
    setDraft("");
    if (out.result.found) {
      setFlash(
        `Trouvé en ${out.round.guesses.length} essai${out.round.guesses.length > 1 ? "s" : ""} !`,
      );
    } else if (mystery) {
      setFlash(`Classement #${out.result.lexiconRank} / ${lexiconSize()}`);
    } else {
      setFlash(formatScore(out.result.score));
    }
    inputRef.current?.focus();
  };

  const suggest = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (q.length < 2) return [] as string[];
    return CEMANTIK_WORDS.filter((w) => w.startsWith(q)).slice(0, 6);
  }, [draft]);

  const hudBest = best
    ? mystery
      ? ` · Best #${best.lexiconRank}`
      : ` · Top ${formatScore(best.score)}`
    : "";

  return (
    <div className={`game-wrap cemantik ${mystery ? "is-mystery" : ""}`}>
      <div className="game-hud">
        <span>
          {meta.kind === "multi" ? "Multi" : "Solo"} · Essais {round.guesses.length}
          {hudBest}
        </span>
        <div className="cemantik-modes" role="tablist" aria-label="Niveau">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`ghost-btn ${mode === m ? "is-on" : ""}`}
              onClick={() => start(m)}
            >
              {MODE_META[m].label}
            </button>
          ))}
        </div>
      </div>

      <p className="cemantik-lead">{meta.blurb}</p>

      {!mystery && (
        <div className="cemantik-thermo" aria-hidden>
          <div
            className="cemantik-thermo-fill"
            style={{ width: `${best ? Math.min(100, best.score) : 0}%` }}
          />
        </div>
      )}

      <form className="cemantik-form" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          className="cemantik-input"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setFlash(null);
          }}
          placeholder="Propose un mot…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={round.found}
          aria-label="Proposition"
        />
        <button type="submit" className="ghost-btn cemantik-go" disabled={round.found || !draft.trim()}>
          Tester
        </button>
      </form>

      {suggest.length > 0 && !round.found && (
        <ul className="cemantik-suggest">
          {suggest.map((w) => (
            <li key={w}>
              <button type="button" onClick={() => setDraft(w)}>
                {w}
              </button>
            </li>
          ))}
        </ul>
      )}

      {flash && <p className={`cemantik-flash ${round.found ? "is-win" : ""}`}>{flash}</p>}

      {round.found && (
        <p className="hint cemantik-win">
          Mot secret : <strong>{round.target}</strong>
          {mystery ? "" : ` — ${formatScore(100)}`}
        </p>
      )}

      <ol className="cemantik-list">
        {round.guesses.map((g) => (
          <li key={g.word} className={`cemantik-row ${g.found ? "is-found" : ""}`}>
            <span className="cemantik-word">{g.word}</span>
            {mystery ? (
              <span className="cemantik-lexrank" title="Classement lexique (1 = le plus proche)">
                #{g.lexiconRank}
              </span>
            ) : (
              <>
                <span className="cemantik-score">{formatScore(g.score)}</span>
                <span className="cemantik-bar" aria-hidden>
                  <i style={{ width: `${Math.min(100, g.score)}%` }} />
                </span>
              </>
            )}
          </li>
        ))}
      </ol>

      {round.guesses.length === 0 && (
        <p className="hint">
          {mystery
            ? `Aucun pourcentage — guide-toi au n° (1 = plus proche, sur ${lexiconSize()} mots).`
            : mode === "mondial"
              ? "Même mot secret pour tout le monde aujourd’hui. Ultra serré."
              : `Propose un mot du lexique (~${CEMANTIK_WORDS.length}).`}
        </p>
      )}
    </div>
  );
}
