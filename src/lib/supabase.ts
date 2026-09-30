import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthMode } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const looksConfigured =
  typeof url === "string" &&
  typeof anon === "string" &&
  url.length > 0 &&
  anon.length > 0 &&
  !url.includes("YOUR_PROJECT") &&
  !anon.includes("YOUR_ANON");

export const authMode: AuthMode = looksConfigured ? "supabase" : "demo";

export const supabase: SupabaseClient | null = looksConfigured
  ? createClient(url as string, anon as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Domaine technique interne — jamais affiché, jamais stocké côté profil.
 * Doit passer la validation email GoTrue (pas de .local / example.com).
 */
export const AUTH_REALM = "players.relay.game";

export function usernameToAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${AUTH_REALM}`;
}

export function authEmailToUsername(email: string | undefined | null): string {
  if (!email) return "";
  return email.split("@")[0] ?? "";
}

export function usernameAuthUrl(): string | null {
  if (!url || !looksConfigured) return null;
  return `${url.replace(/\/$/, "")}/functions/v1/username-auth`;
}
