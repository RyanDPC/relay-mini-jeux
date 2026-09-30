import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { presenceToOnline, touchPresence } from "./api";
import { useAuth } from "./AuthContext";
import type { OnlineUser } from "./types";

type PresenceContextValue = {
  online: OnlineUser[];
  isOnline: (userId: string) => boolean;
};

const PresenceContext = createContext<PresenceContextValue>({
  online: [],
  isOnline: () => false,
});

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [online, setOnline] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const client = supabase;
    if (!user || !client) {
      setOnline([]);
      return;
    }

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let heartbeat: number | undefined;

    // Drop any stale channel with same topic (StrictMode remount).
    for (const existing of client.getChannels()) {
      if (existing.topic === "realtime:relay-online") {
        void client.removeChannel(existing);
      }
    }

    channel = client.channel("relay-online", {
      config: { presence: { key: user.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      if (cancelled || !channel) return;
      const state = channel.presenceState() ?? {};
      setOnline(presenceToOnline(state as never));
    });

    void touchPresence(user.id);
    void channel.subscribe(async (status) => {
      if (cancelled || status !== "SUBSCRIBED" || !channel) return;
      await channel.track({
        username: user.username,
        avatar: user.avatar,
        accent: user.accent,
        at: Date.now(),
      });
    });

    heartbeat = window.setInterval(() => {
      void touchPresence(user.id);
      void channel?.track({
        username: user.username,
        avatar: user.avatar,
        accent: user.accent,
        at: Date.now(),
      });
    }, 25_000);

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
      if (channel) void client.removeChannel(channel);
    };
  }, [user]);

  const value = useMemo(
    () => ({
      online,
      isOnline: (id: string) => online.some((o) => o.id === id),
    }),
    [online],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  return useContext(PresenceContext);
}
