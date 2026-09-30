import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { getGame } from "../lib/games";
import { bestScore, saveScore, topScores } from "../lib/api";
import type { ScoreRow } from "../lib/types";
import { PulseSnake } from "../games/PulseSnake";
import { EchoMemory } from "../games/EchoMemory";
import { DriftBreaker } from "../games/DriftBreaker";
import { Solitaire } from "../games/Solitaire";
import { Blackjack } from "../games/Blackjack";
import { UnoGame } from "../games/UnoGame";
import { UndercoverGame } from "../games/UndercoverGame";
import { WerewolfGame } from "../games/WerewolfGame";
import { AshCircuit } from "../games/AshCircuit";
import { SplitVoltage } from "../games/SplitVoltage";
import { Cemantik } from "../games/Cemantik";
import { CardLab } from "../games/CardLab";
import "./Play.css";

export function Play() {
  const { gameId } = useParams();
  const meta = getGame(gameId ?? "");
  const { user, loading } = useAuth();
  const [liveScore, setLiveScore] = useState(0);
  const [personalBest, setPersonalBest] = useState(0);
  const [board, setBoard] = useState<ScoreRow[]>([]);
  const [boardOpen, setBoardOpen] = useState(false);
  const savedRef = useRef(false);

  const reloadBoard = useCallback(async () => {
    if (!meta || !user) return;
    setBoard(await topScores(meta.id));
    setPersonalBest(await bestScore(user.id, meta.id));
  }, [meta, user]);

  useEffect(() => {
    void reloadBoard();
  }, [reloadBoard]);

  const onScore = useCallback(
    (score: number, final: boolean) => {
      setLiveScore(score);
      if (!final) {
        savedRef.current = false;
        return;
      }
      if (!user || !meta || savedRef.current || score <= 0) return;
      savedRef.current = true;
      void saveScore(user.id, meta.id, score).then(() => reloadBoard());
    },
    [user, meta, reloadBoard],
  );

  if (loading) {
    return <p className="hint play-loading">Chargement…</p>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!meta) {
    return (
      <p className="hint play-loading">
        Jeu introuvable. <Link to="/hub">Retour hub</Link>
      </p>
    );
  }

  const display = user.displayName || user.username;

  return (
    <section className="play play-immersive">
      <header className="play-strip">
        <div className="play-strip-main">
          <Link to="/hub" className="play-back">
            ← Hub
          </Link>
          <span className="play-strip-genre" style={{ color: meta.accent }}>
            {meta.genre}
          </span>
          <h1 className="play-strip-title">{meta.title}</h1>
        </div>
        <div className="play-strip-meta">
          <span className="play-stat">
            Live <strong>{liveScore}</strong>
          </span>
          <span className="play-stat">
            Best <strong>{personalBest}</strong>
          </span>
          <button
            type="button"
            className={`ghost-btn play-board-toggle ${boardOpen ? "is-on" : ""}`}
            onClick={() => setBoardOpen((v) => !v)}
            aria-expanded={boardOpen}
          >
            Classement
          </button>
        </div>
      </header>

      <div className="play-stage">
        <div className="play-stage-game">
          {meta.id === "ash-circuit" && <AshCircuit onScore={onScore} />}
          {meta.id === "split-voltage" && <SplitVoltage onScore={onScore} />}
          {meta.id === "cemantik" && <Cemantik onScore={onScore} />}
          {meta.id === "card-lab" && <CardLab />}
          {meta.id === "solitaire" && <Solitaire onScore={onScore} />}
          {meta.id === "blackjack" && <Blackjack onScore={onScore} />}
          {meta.id === "uno" && <UnoGame playerName={display} onScore={onScore} />}
          {meta.id === "undercover" && (
            <UndercoverGame playerName={display} onScore={onScore} />
          )}
          {meta.id === "werewolf" && (
            <WerewolfGame playerName={display} onScore={onScore} />
          )}
          {meta.id === "pulse-snake" && <PulseSnake onScore={onScore} />}
          {meta.id === "echo-memory" && <EchoMemory onScore={onScore} />}
          {meta.id === "drift-breaker" && <DriftBreaker onScore={onScore} />}
        </div>

        {boardOpen && (
          <aside className="board board-drawer" aria-label="Classement">
            <div className="board-drawer-head">
              <h2>Classement</h2>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setBoardOpen(false)}
              >
                Fermer
              </button>
            </div>
            {board.length === 0 && <p className="hint">Pas encore de scores.</p>}
            <ol>
              {board.map((row, i) => (
                <li key={row.id}>
                  <span>
                    {i + 1}. @{row.username ?? "???"}
                  </span>
                  <strong>{row.score}</strong>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </section>
  );
}
