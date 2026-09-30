import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { usePresence } from "../lib/PresenceContext";
import {
  createParty,
  getParty,
  inviteToParty,
  joinPartyByCode,
  listFriends,
  listPartyInvites,
  respondPartyInvite,
  setPartyScore,
  setPartyStatus,
} from "../lib/api";
import { supabase } from "../lib/supabase";
import type { Friendship, PartyInvite, PartyMember, PartyRoom } from "../lib/types";
import { PulseSnake } from "../games/PulseSnake";
import "./Party.css";

export function PartyLobby() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<PartyInvite[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    setInvites(await listPartyInvites(user.id));
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!user) return;
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel(`party-invites:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "party_invites",
          filter: `to_id=eq.${user.id}`,
        },
        () => {
          void reload();
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [user, reload]);

  if (loading) {
    return (
        <p className="hint">Chargement…</p>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const startParty = async () => {
    setBusy(true);
    setError(null);
    try {
      const room = await createParty(user.id);
      navigate(`/party/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const join = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const room = await joinPartyByCode(user.id, code);
      navigate(`/party/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
      <section className="party-page">
        <header>
          <p className="eyebrow">RELAY · multi</p>
          <h1>Party live</h1>
          <p className="hint">
            Crée une room, invite un ami — scores live. Les tables UNO / Undercover /
            Loup-garou se jouent aussi depuis le hub (bots inclus).
          </p>
        </header>

        <div className="party-actions">
          <button className="primary-btn" type="button" disabled={busy} onClick={() => void startParty()}>
            Créer une party
          </button>
          <form onSubmit={(e) => void join(e)} className="join-form">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={6}
              required
            />
            <button className="ghost-btn" type="submit" disabled={busy}>
              Rejoindre
            </button>
          </form>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <section className="invite-block">
          <h2>Invitations reçues</h2>
          {invites.length === 0 && <p className="hint">Aucune.</p>}
          <ul>
            {invites.map((inv) => (
              <li key={inv.id}>
                <span>
                  @{inv.from?.username} · room {inv.room?.code}
                </span>
                <span className="row-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() =>
                      void respondPartyInvite(user.id, inv.id, true).then(() =>
                        navigate(`/party/${inv.roomId}`),
                      )
                    }
                  >
                    Accepter
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => void respondPartyInvite(user.id, inv.id, false).then(reload)}
                  >
                    Refuser
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </section>
  );
}

export function PartyRoomPage() {
  const { roomId } = useParams();
  const { user, loading } = useAuth();
  const { isOnline } = usePresence();
  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [inviteUser, setInviteUser] = useState("");
  const [liveScore, setLiveScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dueling, setDueling] = useState(false);

  const reload = useCallback(async () => {
    if (!roomId) return;
    const data = await getParty(roomId);
    if (!data) return;
    setRoom(data.room);
    setMembers(data.members);
    setDueling(data.room.status === "playing");
  }, [roomId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!user) return;
    void listFriends(user.id).then(setFriends);
  }, [user]);

  useEffect(() => {
    if (!roomId) return;
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel(`party-room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "party_members", filter: `room_id=eq.${roomId}` },
        () => void reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "party_rooms", filter: `id=eq.${roomId}` },
        () => void reload(),
      )
      .on("broadcast", { event: "score" }, ({ payload }) => {
        if (payload?.userId && payload.userId !== user?.id) {
          setMembers((prev) =>
            prev.map((m) =>
              m.userId === payload.userId ? { ...m, score: Number(payload.score) || 0 } : m,
            ),
          );
        }
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [roomId, reload, user?.id]);

  if (loading) {
    return (
        <p className="hint">Chargement…</p>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!room) {
    return (
        <p className="hint">
          Party introuvable. <Link to="/party">Retour</Link>
        </p>
    );
  }

  const accepted = friends.filter((f) => f.status === "accepted");
  const winner = [...members].sort((a, b) => b.score - a.score)[0];

  const sendInvite = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await inviteToParty(room.id, user.id, inviteUser);
      setMessage(`Invitation envoyée à @${inviteUser}`);
      setInviteUser("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const startDuel = async () => {
    await setPartyStatus(room.id, "playing");
    setDueling(true);
    setLiveScore(0);
  };

  const pushScore = async (score: number, final: boolean) => {
    setLiveScore(score);
    await setPartyScore(room.id, user.id, score);
    if (supabase) {
      const ch = supabase.channel(`party-room:${room.id}`);
      await ch.subscribe();
      await ch.send({
        type: "broadcast",
        event: "score",
        payload: { userId: user.id, score },
      });
    }
    if (final) {
      await reload();
    }
  };

  return (
      <section className="party-page">
        <header>
          <p className="eyebrow">Party · {room.code}</p>
          <h1>Duel live</h1>
          <p className="hint">
            Statut : {room.status} · <Link to="/party">Lobby</Link>
          </p>
        </header>

        <ul className="member-rail">
          {members.map((m) => (
            <li key={m.userId}>
              <span className={isOnline(m.userId) ? "dot on" : "dot"} />
              {m.profile?.avatar} @{m.profile?.username ?? "?"}
              <strong>{m.userId === user.id ? liveScore || m.score : m.score}</strong>
            </li>
          ))}
        </ul>

        {user.id === room.hostId && (
          <form className="invite-form" onSubmit={(e) => void sendInvite(e)}>
            <input
              list="party-friends"
              value={inviteUser}
              onChange={(e) => setInviteUser(e.target.value)}
              placeholder="username ami"
              required
            />
            <datalist id="party-friends">
              {accepted.map((f) => (
                <option key={f.id} value={f.other?.username ?? ""} />
              ))}
            </datalist>
            <button className="ghost-btn" type="submit">
              Inviter
            </button>
            {!dueling && (
              <button className="primary-btn" type="button" onClick={() => void startDuel()}>
                Lancer le duel
              </button>
            )}
          </form>
        )}

        {message && <p className="ok-banner">{message}</p>}
        {error && <div className="error-banner">{error}</div>}

        {dueling ? (
          <div className="duel-wrap">
            <PulseSnake onScore={(s, final) => void pushScore(s, final)} />
          </div>
        ) : (
          <p className="hint">
            En attente du host pour lancer.{" "}
            {winner && members.length > 1
              ? `Dernier top : @${winner.profile?.username} (${winner.score})`
              : ""}
          </p>
        )}
      </section>
  );
}
