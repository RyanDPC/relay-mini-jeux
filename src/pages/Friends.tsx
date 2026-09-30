import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { usePresence } from "../lib/PresenceContext";
import {
  listFriends,
  removeFriend,
  requestFriend,
  respondFriend,
  searchUsers,
} from "../lib/api";
import type { Friendship, Profile } from "../lib/types";
import "./Friends.css";

export function Friends() {
  const { user, loading } = useAuth();
  const { isOnline } = usePresence();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setFriends(await listFriends(user.id));
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      void searchUsers(query, user.id).then(setResults);
    }, 200);
    return () => clearTimeout(t);
  }, [query, user]);

  if (loading) {
    return (
        <p className="hint">Chargement…</p>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const pending = friends.filter(
    (f) => f.status === "pending" && f.addresseeId === user.id,
  );
  const outgoing = friends.filter(
    (f) => f.status === "pending" && f.requesterId === user.id,
  );
  const accepted = friends.filter((f) => f.status === "accepted");

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await requestFriend(user.id, username);
      setMessage(`Demande envoyée à @${username.trim().toLowerCase()}`);
      setUsername("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
      <section className="friends">
        <header className="friends-head">
          <p className="eyebrow">RELAY · social</p>
          <h1>Amis</h1>
          <p className="hint">
            Username uniquement. Statut en ligne live ·{" "}
            <Link to="/chat">Chat</Link> · <Link to="/party">Party</Link>
          </p>
        </header>

        <form className="add-form" onSubmit={(e) => void onAdd(e)}>
          <div className="field grow">
            <label htmlFor="friend-user">Ajouter un ami</label>
            <input
              id="friend-user"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setQuery(e.target.value);
              }}
              placeholder="username"
              list="user-suggest"
              required
            />
            <datalist id="user-suggest">
              {results.map((r) => (
                <option key={r.id} value={r.username} />
              ))}
            </datalist>
          </div>
          <button className="primary-btn" type="submit">
            Envoyer
          </button>
        </form>

        {message && <p className="ok-banner">{message}</p>}
        {error && <div className="error-banner">{error}</div>}

        <div className="friends-columns">
          <section>
            <h2>Demandes reçues</h2>
            {pending.length === 0 && <p className="hint">Aucune.</p>}
            <ul>
              {pending.map((f) => (
                <li key={f.id}>
                  <span>@{f.other?.username ?? "?"}</span>
                  <span className="row-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => void respondFriend(user.id, f.id, true).then(reload)}
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => void respondFriend(user.id, f.id, false).then(reload)}
                    >
                      Refuser
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>En attente</h2>
            {outgoing.length === 0 && <p className="hint">Aucune.</p>}
            <ul>
              {outgoing.map((f) => (
                <li key={f.id}>
                  <span>@{f.other?.username ?? "?"}</span>
                  <span className="muted-tag">envoyée</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Liste</h2>
            {accepted.length === 0 && <p className="hint">Ajoute ton premier ami.</p>}
            <ul>
              {accepted.map((f) => (
                <li key={f.id}>
                  <span style={{ color: f.other?.accent }}>
                    <span className={isOnline(f.other?.id ?? "") ? "dot on" : "dot"} />
                    {f.other?.avatar} @{f.other?.username}
                  </span>
                  <span className="row-actions">
                    <Link className="ghost-btn" to={`/chat?with=${f.other?.id}`}>
                      Chat
                    </Link>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => void removeFriend(user.id, f.id).then(reload)}
                    >
                      Retirer
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
  );
}
