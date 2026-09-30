import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authMode, supabase, usernameAuthUrl } from "./supabase";
import { demoStore } from "./demoStore";
import type { Profile } from "./types";
import type { Session } from "@supabase/supabase-js";

type AuthResult = {
  recoveryCode?: string;
};

type AuthContextValue = {
  user: Profile | null;
  loading: boolean;
  mode: typeof authMode;
  lastRecoveryCode: string | null;
  clearRecoveryCode: () => void;
  signUp: (username: string, password: string) => Promise<AuthResult>;
  signIn: (username: string, password: string) => Promise<void>;
  recover: (
    username: string,
    recoveryCode: string,
    newPassword: string,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSupabaseProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, accent, avatar, last_seen_at, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    accent: data.accent,
    avatar: data.avatar ?? "◆",
    lastSeenAt: data.last_seen_at,
    createdAt: data.created_at,
  };
}

async function callUsernameAuth(
  action: "signup" | "signin" | "recover",
  payload: Record<string, string>,
): Promise<{ session?: Session; recoveryCode?: string }> {
  const endpoint = usernameAuthUrl();
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  if (!endpoint || !supabase) throw new Error("Supabase non configuré.");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anon}`,
      apikey: anon,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = (await res.json()) as {
    error?: string;
    session?: Session;
    recoveryCode?: string;
  };
  if (!res.ok) throw new Error(body.error ?? "Auth échouée");
  if (body.recoveryCode) {
    sessionStorage.setItem("relay.pendingRecoveryCode", body.recoveryCode);
  }
  if (body.session) {
    const { error } = await supabase.auth.setSession({
      access_token: body.session.access_token,
      refresh_token: body.session.refresh_token,
    });
    if (error) throw new Error(error.message);
  }
  return { session: body.session, recoveryCode: body.recoveryCode };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRecoveryCode, setLastRecoveryCode] = useState<string | null>(null);

  const refresh = async () => {
    if (authMode === "demo") {
      setUser(await demoStore.getSession());
      return;
    }
    if (!supabase) {
      setUser(null);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setUser(null);
      return;
    }
    setUser(await fetchSupabaseProfile(data.session.user.id));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refresh();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    if (authMode === "supabase" && supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session) {
          setUser(null);
          return;
        }
        setUser(await fetchSupabaseProfile(session.user.id));
      });
      return () => {
        mounted = false;
        sub.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (username: string, password: string) => {
    if (authMode === "demo") {
      setUser(await demoStore.signUp(username, password));
      const code = "DEMO-RECOVER";
      setLastRecoveryCode(code);
      return { recoveryCode: code };
    }
    const result = await callUsernameAuth("signup", { username, password });
    if (!result.session) throw new Error("Création de compte échouée.");
    setUser(await fetchSupabaseProfile(result.session.user.id));
    if (result.recoveryCode) {
      setLastRecoveryCode(result.recoveryCode);
      sessionStorage.setItem("relay.pendingRecoveryCode", result.recoveryCode);
    }
    return { recoveryCode: result.recoveryCode };
  };

  const signIn = async (username: string, password: string) => {
    if (authMode === "demo") {
      setUser(await demoStore.signIn(username, password));
      return;
    }
    const result = await callUsernameAuth("signin", { username, password });
    if (!result.session) throw new Error("Connexion échouée.");
    setUser(await fetchSupabaseProfile(result.session.user.id));
  };

  const recover = async (username: string, recoveryCode: string, newPassword: string) => {
    if (authMode === "demo") throw new Error("Récupération dispo en mode Supabase.");
    const result = await callUsernameAuth("recover", {
      username,
      recoveryCode,
      newPassword,
    });
    if (result.session) {
      setUser(await fetchSupabaseProfile(result.session.user.id));
    }
    if (result.recoveryCode) {
      setLastRecoveryCode(result.recoveryCode);
      sessionStorage.setItem("relay.pendingRecoveryCode", result.recoveryCode);
    }
    return { recoveryCode: result.recoveryCode };
  };

  const signOut = async () => {
    if (authMode === "demo") {
      await demoStore.signOut();
      setUser(null);
      return;
    }
    await supabase?.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mode: authMode,
        lastRecoveryCode,
        clearRecoveryCode: () => setLastRecoveryCode(null),
        signUp,
        signIn,
        recover,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
