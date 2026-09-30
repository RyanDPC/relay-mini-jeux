import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { GAMES } from "../lib/games";
import "./Hub.css";

export function Hub() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <p className="hint">Chargement…</p>
      </>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <>
      <section className="hub">
        <header className="hub-head">
          <p className="eyebrow">RELAY · hub</p>
          <h1>Salut @{user.username}</h1>
          <p className="hint">
            Cartes, mots & social — Cemantik, Solitaire, Blackjack, UNO,
            Undercover, Loup-garou. Ou lance une <Link to="/party">party live</Link>.
          </p>
        </header>

        <ul className="game-rail">
          {GAMES.filter((g) => g.id !== "card-lab").map((game, i) => (
            <li
              key={game.id}
              style={{ animationDelay: `${i * 90}ms` }}
              className={game.featured ? "is-featured" : "is-archive"}
            >
              <Link to={`/play/${game.id}`} className="game-launch">
                <span className="genre" style={{ color: game.accent }}>
                  {game.genre}
                </span>
                <strong>{game.title}</strong>
                <span className="blurb">{game.blurb}</span>
                <span className="launch-cta">Lancer →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
