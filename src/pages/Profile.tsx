import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { updateProfile } from "../lib/api";
import "./Profile.css";

const AVATARS = ["◆", "▲", "●", "■", "✦", "◎", "△", "◈"];
const ACCENTS = ["#f2c14e", "#3dcf9a", "#6ec8ff", "#ff8a5b", "#c9a0ff", "#e8efe9"];

export function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "◆");
  const [accent, setAccent] = useState(user?.accent ?? "#f2c14e");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
        <p className="hint">Chargement…</p>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await updateProfile(user.id, {
        displayName: displayName.trim() || user.username,
        avatar,
        accent,
      });
      await refresh();
      setMessage("Profil mis à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
      <section className="profile-page">
        <header>
          <p className="eyebrow">RELAY · profil</p>
          <h1>
            {avatar} @{user.username}
          </h1>
          <p className="hint">Personnalise ton affichage. Aucune donnée sensible.</p>
        </header>

        <form className="profile-form" onSubmit={(e) => void onSave(e)}>
          <div className="field">
            <label htmlFor="display">Nom affiché</label>
            <input
              id="display"
              value={displayName || user.displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={24}
            />
          </div>

          <div className="field">
            <span className="label-like">Avatar</span>
            <div className="avatar-row">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={avatar === a ? "active" : ""}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="label-like">Accent</span>
            <div className="accent-row">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={accent === c ? "active" : ""}
                  style={{ background: c }}
                  aria-label={c}
                  onClick={() => setAccent(c)}
                />
              ))}
            </div>
          </div>

          {message && <p className="ok-banner">{message}</p>}
          {error && <div className="error-banner">{error}</div>}
          <button className="primary-btn" type="submit">
            Enregistrer
          </button>
        </form>
      </section>
  );
}
