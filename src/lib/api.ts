import { authMode, supabase } from "./supabase";
import { demoStore } from "./demoStore";
import type {
  ChatMessage,
  Friendship,
  GameId,
  OnlineUser,
  PartyInvite,
  PartyMember,
  PartyRoom,
  Profile,
  ScoreRow,
} from "./types";

function mapProfile(row: {
  id: string;
  username: string;
  display_name: string;
  accent: string;
  avatar?: string;
  last_seen_at?: string;
  created_at: string;
}): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    accent: row.accent,
    avatar: row.avatar ?? "◆",
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}

export async function searchUsers(query: string, selfId: string): Promise<Profile[]> {
  if (authMode === "demo") return demoStore.searchUsers(query, selfId);
  if (!supabase) return [];
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, accent, avatar, last_seen_at, created_at")
    .ilike("username", `%${q}%`)
    .neq("id", selfId)
    .limit(8);
  if (error || !data) return [];
  return data.map(mapProfile);
}

export async function listFriends(selfId: string): Promise<Friendship[]> {
  if (authMode === "demo") return demoStore.listFriends(selfId);
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("friendships")
    .select(
      "id, requester_id, addressee_id, status, created_at, requester:profiles!friendships_requester_id_fkey(id, username, display_name, accent, avatar, last_seen_at, created_at), addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, accent, avatar, last_seen_at, created_at)",
    )
    .or(`requester_id.eq.${selfId},addressee_id.eq.${selfId}`)
    .neq("status", "blocked");
  if (error || !data) return [];

  return data.map((row) => {
    const requester = Array.isArray(row.requester) ? row.requester[0] : row.requester;
    const addressee = Array.isArray(row.addressee) ? row.addressee[0] : row.addressee;
    const otherRaw = row.requester_id === selfId ? addressee : requester;
    return {
      id: row.id,
      requesterId: row.requester_id,
      addresseeId: row.addressee_id,
      status: row.status,
      createdAt: row.created_at,
      other: otherRaw ? mapProfile(otherRaw) : undefined,
    };
  });
}

export async function requestFriend(selfId: string, username: string) {
  if (authMode === "demo") return demoStore.requestFriend(selfId, username);
  if (!supabase) throw new Error("Supabase non configuré.");
  const clean = username.trim().toLowerCase();
  const { data: target, error: findErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", clean)
    .maybeSingle();
  if (findErr || !target) throw new Error("Joueur introuvable.");
  if (target.id === selfId) throw new Error("Tu ne peux pas t’ajouter toi-même.");
  const { error } = await supabase.from("friendships").insert({
    requester_id: selfId,
    addressee_id: target.id,
    status: "pending",
  });
  if (error) throw new Error(error.message);
}

export async function respondFriend(selfId: string, friendshipId: string, accept: boolean) {
  if (authMode === "demo") return demoStore.respondFriend(selfId, friendshipId, accept);
  if (!supabase) throw new Error("Supabase non configuré.");
  if (!accept) {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .eq("addressee_id", selfId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .eq("addressee_id", selfId);
  if (error) throw new Error(error.message);
}

export async function removeFriend(selfId: string, friendshipId: string) {
  if (authMode === "demo") return demoStore.removeFriend?.(selfId, friendshipId);
  if (!supabase) throw new Error("Supabase non configuré.");
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${selfId},addressee_id.eq.${selfId}`);
  if (error) throw new Error(error.message);
}

export async function updateProfile(
  selfId: string,
  patch: { displayName?: string; accent?: string; avatar?: string },
) {
  if (authMode === "demo") return demoStore.updateProfile?.(selfId, patch);
  if (!supabase) throw new Error("Supabase non configuré.");
  const payload: Record<string, string> = {};
  if (patch.displayName !== undefined) payload.display_name = patch.displayName.slice(0, 24);
  if (patch.accent !== undefined) payload.accent = patch.accent;
  if (patch.avatar !== undefined) payload.avatar = patch.avatar.slice(0, 2);
  const { error } = await supabase.from("profiles").update(payload).eq("id", selfId);
  if (error) throw new Error(error.message);
}

export async function touchPresence(selfId: string) {
  if (authMode === "demo" || !supabase) return;
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", selfId);
}

export async function saveScore(userId: string, gameId: GameId, score: number) {
  if (authMode === "demo") return demoStore.saveScore(userId, gameId, score);
  if (!supabase) return;
  await supabase.from("scores").insert({
    user_id: userId,
    game_id: gameId,
    score,
  });
}

export async function topScores(gameId: GameId, limit = 8): Promise<ScoreRow[]> {
  if (authMode === "demo") return demoStore.topScores(gameId, limit);
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("scores")
    .select("id, user_id, game_id, score, created_at, profiles(username)")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      userId: row.user_id,
      gameId: row.game_id,
      score: row.score,
      createdAt: row.created_at,
      username: profile?.username,
    };
  });
}

export async function bestScore(userId: string, gameId: GameId): Promise<number> {
  if (authMode === "demo") return demoStore.bestScore(userId, gameId);
  if (!supabase) return 0;
  const { data } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.score ?? 0;
}

export async function listMessages(selfId: string, otherId: string): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, created_at, read_at")
    .or(
      `and(sender_id.eq.${selfId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${selfId})`,
    )
    .order("created_at", { ascending: true })
    .limit(100);
  if (error || !data) return [];
  return data.map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    recipientId: m.recipient_id,
    body: m.body,
    createdAt: m.created_at,
    readAt: m.read_at,
  }));
}

export async function sendMessage(selfId: string, otherId: string, body: string) {
  if (!supabase) throw new Error("Chat indisponible hors Supabase.");
  const text = body.trim().slice(0, 500);
  if (!text) throw new Error("Message vide.");
  const { error } = await supabase.from("messages").insert({
    sender_id: selfId,
    recipient_id: otherId,
    body: text,
  });
  if (error) throw new Error(error.message);
}

function roomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export async function createParty(selfId: string): Promise<PartyRoom> {
  if (!supabase) throw new Error("Parties indisponibles hors Supabase.");
  const code = roomCode();
  const { data, error } = await supabase
    .from("party_rooms")
    .insert({ host_id: selfId, code, status: "open" })
    .select("id, host_id, code, status, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Création party échouée");
  await supabase.from("party_members").insert({ room_id: data.id, user_id: selfId, score: 0 });
  return {
    id: data.id,
    hostId: data.host_id,
    code: data.code,
    status: data.status,
    createdAt: data.created_at,
  };
}

export async function inviteToParty(roomId: string, fromId: string, toUsername: string) {
  if (!supabase) throw new Error("Parties indisponibles hors Supabase.");
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", toUsername.trim().toLowerCase())
    .maybeSingle();
  if (!target) throw new Error("Joueur introuvable.");
  const { error } = await supabase.from("party_invites").insert({
    room_id: roomId,
    from_id: fromId,
    to_id: target.id,
    status: "pending",
  });
  if (error) throw new Error(error.message);
}

export async function listPartyInvites(selfId: string): Promise<PartyInvite[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("party_invites")
    .select("id, room_id, from_id, to_id, status, created_at")
    .eq("to_id", selfId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const fromIds = [...new Set(data.map((d) => d.from_id))];
  const roomIds = [...new Set(data.map((d) => d.room_id))];
  const [{ data: profiles }, { data: rooms }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, accent, avatar, created_at")
      .in("id", fromIds.length ? fromIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("party_rooms")
      .select("id, host_id, code, status, created_at")
      .in("id", roomIds.length ? roomIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, mapProfile(p)]));
  const roomMap = Object.fromEntries(
    (rooms ?? []).map((r) => [
      r.id,
      {
        id: r.id,
        hostId: r.host_id,
        code: r.code,
        status: r.status,
        createdAt: r.created_at,
      } satisfies PartyRoom,
    ]),
  );

  return data.map((row) => ({
    id: row.id,
    roomId: row.room_id,
    fromId: row.from_id,
    toId: row.to_id,
    status: row.status,
    createdAt: row.created_at,
    from: profileMap[row.from_id],
    room: roomMap[row.room_id],
  }));
}

export async function respondPartyInvite(selfId: string, inviteId: string, accept: boolean) {
  if (!supabase) throw new Error("Parties indisponibles hors Supabase.");
  const { data: invite, error: findErr } = await supabase
    .from("party_invites")
    .select("id, room_id, to_id")
    .eq("id", inviteId)
    .eq("to_id", selfId)
    .maybeSingle();
  if (findErr || !invite) throw new Error("Invitation introuvable.");
  const { error } = await supabase
    .from("party_invites")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", inviteId);
  if (error) throw new Error(error.message);
  if (accept) {
    await supabase.from("party_members").upsert({
      room_id: invite.room_id,
      user_id: selfId,
      score: 0,
    });
  }
}

export async function getParty(roomId: string): Promise<{
  room: PartyRoom;
  members: PartyMember[];
} | null> {
  if (!supabase) return null;
  const { data: room, error: roomErr } = await supabase
    .from("party_rooms")
    .select("id, host_id, code, status, created_at")
    .eq("id", roomId)
    .maybeSingle();
  if (roomErr || !room) return null;

  const { data: members } = await supabase
    .from("party_members")
    .select("room_id, user_id, score, joined_at")
    .eq("room_id", roomId);

  const userIds = (members ?? []).map((m) => m.user_id);
  let profilesById: Record<string, Profile> = {};
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, accent, avatar, created_at")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profilesById[p.id] = mapProfile(p);
    }
  }

  return {
    room: {
      id: room.id,
      hostId: room.host_id,
      code: room.code,
      status: room.status,
      createdAt: room.created_at,
    },
    members: (members ?? []).map((m) => ({
      roomId: m.room_id,
      userId: m.user_id,
      score: m.score,
      joinedAt: m.joined_at,
      profile: profilesById[m.user_id],
    })),
  };
}

export async function setPartyScore(roomId: string, userId: string, score: number) {
  if (!supabase) return;
  await supabase
    .from("party_members")
    .update({ score })
    .eq("room_id", roomId)
    .eq("user_id", userId);
}

export async function setPartyStatus(roomId: string, status: PartyRoom["status"]) {
  if (!supabase) return;
  await supabase.from("party_rooms").update({ status }).eq("id", roomId);
}

export async function joinPartyByCode(selfId: string, code: string): Promise<PartyRoom> {
  if (!supabase) throw new Error("Parties indisponibles hors Supabase.");
  const { data: room, error } = await supabase
    .from("party_rooms")
    .select("id, host_id, code, status, created_at")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error || !room) throw new Error("Code party invalide.");
  if (room.status === "closed") throw new Error("Cette party est fermée.");
  await supabase.from("party_members").upsert({
    room_id: room.id,
    user_id: selfId,
    score: 0,
  });
  return {
    id: room.id,
    hostId: room.host_id,
    code: room.code,
    status: room.status,
    createdAt: room.created_at,
  };
}

/** Convert Realtime presence state to online users list. */
export function presenceToOnline(
  state: Record<string, Array<{ username?: string; avatar?: string; accent?: string }>>,
): OnlineUser[] {
  return Object.entries(state).map(([id, metas]) => {
    const m = metas[0] ?? {};
    return {
      id,
      username: m.username ?? "???",
      avatar: m.avatar ?? "◆",
      accent: m.accent ?? "#f2c14e",
    };
  });
}
