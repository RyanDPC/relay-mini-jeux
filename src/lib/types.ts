export type GameId =
  | "ash-circuit"
  | "split-voltage"
  | "cemantik"
  | "solitaire"
  | "blackjack"
  | "uno"
  | "undercover"
  | "werewolf"
  | "card-lab"
  | "pulse-snake"
  | "echo-memory"
  | "drift-breaker";

export type GameMode = "solo" | "social";

export type GameMeta = {
  id: GameId;
  title: string;
  genre: string;
  blurb: string;
  accent: string;
  mode: GameMode;
  featured?: boolean;
};

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  accent: string;
  avatar: string;
  lastSeenAt?: string;
  createdAt: string;
};

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  other?: Profile;
};

export type ScoreRow = {
  id: string;
  userId: string;
  gameId: GameId;
  score: number;
  createdAt: string;
  username?: string;
};

export type AuthMode = "demo" | "supabase";

export type ChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};

export type PartyRoom = {
  id: string;
  hostId: string;
  code: string;
  status: "open" | "playing" | "closed";
  createdAt: string;
};

export type PartyMember = {
  roomId: string;
  userId: string;
  score: number;
  joinedAt: string;
  profile?: Profile;
};

export type PartyInvite = {
  id: string;
  roomId: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  from?: Profile;
  room?: PartyRoom;
};

export type OnlineUser = {
  id: string;
  username: string;
  avatar: string;
  accent: string;
};
