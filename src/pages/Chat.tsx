import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { usePresence } from "../lib/PresenceContext";
import { listFriends, listMessages, sendMessage } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { ChatMessage, Friendship } from "../lib/types";
import "./Chat.css";

export function ChatPage() {
  const { user, loading } = useAuth();
  const { isOnline } = usePresence();
  const [params, setParams] = useSearchParams();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const peerId = params.get("with");

  const accepted = useMemo(
    () => friends.filter((f) => f.status === "accepted"),
    [friends],
  );
  const peer = accepted.find((f) => f.other?.id === peerId)?.other;

  useEffect(() => {
    if (!user) return;
    void listFriends(user.id).then(setFriends);
  }, [user]);

  useEffect(() => {
    if (!user || !peerId) return;
    const client = supabase;
    if (!client) return;
    let alive = true;
    void listMessages(user.id, peerId).then((rows) => {
      if (alive) setMessages(rows);
    });

    const channel = client
      .channel(`chat:${[user.id, peerId].sort().join(":")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            body: string;
            created_at: string;
            read_at: string | null;
          };
          const involves =
            (row.sender_id === user.id && row.recipient_id === peerId) ||
            (row.sender_id === peerId && row.recipient_id === user.id);
          if (!involves) return;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    senderId: row.sender_id,
                    recipientId: row.recipient_id,
                    body: row.body,
                    createdAt: row.created_at,
                    readAt: row.read_at,
                  },
                ],
          );
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void client.removeChannel(channel);
    };
  }, [user, peerId]);

  if (loading) {
    return (
        <p className="hint">Chargement…</p>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!peerId) return;
    setError(null);
    try {
      await sendMessage(user.id, peerId, body);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
      <section className="chat-page">
        <header>
          <p className="eyebrow">RELAY · chat</p>
          <h1>Messages</h1>
          <p className="hint">Temps réel entre amis uniquement.</p>
        </header>

        <div className="chat-layout">
          <aside className="chat-peers">
            <h2>Amis</h2>
            {accepted.length === 0 && <p className="hint">Ajoute des amis d’abord.</p>}
            <ul>
              {accepted.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className={peerId === f.other?.id ? "active" : ""}
                    onClick={() =>
                      setParams(f.other ? { with: f.other.id } : {})
                    }
                  >
                    <span className={isOnline(f.other?.id ?? "") ? "dot on" : "dot"} />
                    {f.other?.avatar} @{f.other?.username}
                  </button>
                </li>
              ))}
            </ul>
            <Link className="ghost-btn" to="/friends">
              Gérer les amis
            </Link>
          </aside>

          <div className="chat-thread">
            {!peer && <p className="hint">Choisis un ami pour discuter.</p>}
            {peer && (
              <>
                <div className="thread-head">
                  <strong>
                    {peer.avatar} @{peer.username}
                  </strong>
                  <span className={isOnline(peer.id) ? "online" : "offline"}>
                    {isOnline(peer.id) ? "en ligne" : "hors ligne"}
                  </span>
                </div>
                <ul className="thread-msgs">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={m.senderId === user.id ? "mine" : "theirs"}
                    >
                      {m.body}
                    </li>
                  ))}
                </ul>
                <form className="thread-form" onSubmit={(e) => void onSend(e)}>
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Écrire…"
                    maxLength={500}
                    required
                  />
                  <button className="primary-btn" type="submit">
                    Envoyer
                  </button>
                </form>
                {error && <div className="error-banner">{error}</div>}
              </>
            )}
          </div>
        </div>
      </section>
  );
}
