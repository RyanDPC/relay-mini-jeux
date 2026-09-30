import type { Friendship, Profile, ScoreRow, GameId } from "./types";

const KEY = "relay.demo.v1";

type DemoDb = {
  users: Array<{
    id: string;
    username: string;
    passwordHash: string;
    displayName: string;
    accent: string;
    createdAt: string;
  }>;
  sessionUserId: string | null;
  friendships: Friendship[];
  scores: ScoreRow[];
};

function emptyDb(): DemoDb {
  return {
    users: [],
    sessionUserId: null,
    friendships: [],
    scores: [],
  };
}

function read(): DemoDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyDb();
    return { ...emptyDb(), ...JSON.parse(raw) } as DemoDb;
  } catch {
    return emptyDb();
  }
}

function write(db: DemoDb) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

/** Hash non-crypto uniquement pour le mode démo local — jamais pour la prod. */
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`relay-demo:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toProfile(u: DemoDb["users"][number]): Profile {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    accent: u.accent,
    avatar: "◆",
    createdAt: u.createdAt,
  };
}

const ACCENTS = ["#f2c14e", "#3dcf9a", "#6ec8ff", "#ff8a5b", "#c9a0ff"];

export const demoStore = {
  async getSession(): Promise<Profile | null> {
    const db = read();
    if (!db.sessionUserId) return null;
    const user = db.users.find((u) => u.id === db.sessionUserId);
    return user ? toProfile(user) : null;
  },

  async signUp(username: string, password: string): Promise<Profile> {
    const db = read();
    const clean = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      throw new Error("Username : 3–20 caractères (a-z, 0-9, _).");
    }
    if (password.length < 8) {
      throw new Error("Mot de passe : 8 caractères minimum.");
    }
    if (db.users.some((u) => u.username === clean)) {
      throw new Error("Ce username est déjà pris.");
    }
    const user = {
      id: crypto.randomUUID(),
      username: clean,
      passwordHash: await hashPassword(password),
      displayName: clean,
      accent: ACCENTS[db.users.length % ACCENTS.length],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.sessionUserId = user.id;
    write(db);
    return toProfile(user);
  },

  async signIn(username: string, password: string): Promise<Profile> {
    const db = read();
    const clean = username.trim().toLowerCase();
    const user = db.users.find((u) => u.username === clean);
    if (!user || user.passwordHash !== (await hashPassword(password))) {
      throw new Error("Identifiants incorrects.");
    }
    db.sessionUserId = user.id;
    write(db);
    return toProfile(user);
  },

  async signOut() {
    const db = read();
    db.sessionUserId = null;
    write(db);
  },

  async searchUsers(query: string, selfId: string): Promise<Profile[]> {
    const db = read();
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return db.users
      .filter((u) => u.id !== selfId && u.username.includes(q))
      .slice(0, 8)
      .map(toProfile);
  },

  async listFriends(selfId: string): Promise<Friendship[]> {
    const db = read();
    return db.friendships
      .filter(
        (f) =>
          f.status !== "blocked" &&
          (f.requesterId === selfId || f.addresseeId === selfId),
      )
      .map((f) => {
        const otherId = f.requesterId === selfId ? f.addresseeId : f.requesterId;
        const otherUser = db.users.find((u) => u.id === otherId);
        return {
          ...f,
          other: otherUser ? toProfile(otherUser) : undefined,
        };
      });
  },

  async requestFriend(selfId: string, targetUsername: string): Promise<void> {
    const db = read();
    const target = db.users.find(
      (u) => u.username === targetUsername.trim().toLowerCase(),
    );
    if (!target) throw new Error("Joueur introuvable.");
    if (target.id === selfId) throw new Error("Tu ne peux pas t’ajouter toi-même.");
    const exists = db.friendships.some(
      (f) =>
        (f.requesterId === selfId && f.addresseeId === target.id) ||
        (f.requesterId === target.id && f.addresseeId === selfId),
    );
    if (exists) throw new Error("Demande déjà existante.");
    db.friendships.push({
      id: crypto.randomUUID(),
      requesterId: selfId,
      addresseeId: target.id,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    write(db);
  },

  async respondFriend(
    selfId: string,
    friendshipId: string,
    accept: boolean,
  ): Promise<void> {
    const db = read();
    const f = db.friendships.find((x) => x.id === friendshipId);
    if (!f || f.addresseeId !== selfId) throw new Error("Demande introuvable.");
    if (!accept) {
      db.friendships = db.friendships.filter((x) => x.id !== friendshipId);
    } else {
      f.status = "accepted";
    }
    write(db);
  },

  async removeFriend(selfId: string, friendshipId: string): Promise<void> {
    const db = read();
    db.friendships = db.friendships.filter((f) => {
      if (f.id !== friendshipId) return true;
      return f.requesterId !== selfId && f.addresseeId !== selfId;
    });
    write(db);
  },

  async updateProfile(
    selfId: string,
    patch: { displayName?: string; accent?: string; avatar?: string },
  ): Promise<void> {
    const db = read();
    const user = db.users.find((u) => u.id === selfId);
    if (!user) throw new Error("Profil introuvable.");
    if (patch.displayName) user.displayName = patch.displayName.slice(0, 24);
    if (patch.accent) user.accent = patch.accent;
    write(db);
  },

  async saveScore(userId: string, gameId: GameId, score: number): Promise<void> {
    const db = read();
    db.scores.push({
      id: crypto.randomUUID(),
      userId,
      gameId,
      score,
      createdAt: new Date().toISOString(),
    });
    write(db);
  },

  async topScores(gameId: GameId, limit = 8): Promise<ScoreRow[]> {
    const db = read();
    return db.scores
      .filter((s) => s.gameId === gameId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => {
        const user = db.users.find((u) => u.id === s.userId);
        return { ...s, username: user?.username };
      });
  },

  async bestScore(userId: string, gameId: GameId): Promise<number> {
    const db = read();
    const scores = db.scores
      .filter((s) => s.userId === userId && s.gameId === gameId)
      .map((s) => s.score);
    return scores.length ? Math.max(...scores) : 0;
  },
};
