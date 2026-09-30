import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REALM = "players.relay.game";

/** Rate limit in-memory (best-effort per isolate). */
const hits = new Map<string, { n: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 20;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.reset) {
    hits.set(key, { n: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (row.n >= MAX_HITS) return false;
  row.n += 1;
  return true;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function usernameToEmail(username: string) {
  return `${username}@${REALM}`;
}

function makeRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(`relay-recover:${code.trim().toUpperCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  try {
    const body = await req.json();
    const action = String(body.action ?? "");
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const recoveryCode = String(body.recoveryCode ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!rateLimit(`${ip}:${action}`)) {
      return json(429, { error: "Trop de tentatives. Réessaie dans une minute." });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return json(400, { error: "Username : 3–20 caractères (a-z, 0-9, _)." });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const email = usernameToEmail(username);

    if (action === "signup") {
      if (password.length < 8) {
        return json(400, { error: "Mot de passe : 8 caractères minimum." });
      }
      if (!rateLimit(`signup:${username}`)) {
        return json(429, { error: "Trop de tentatives pour ce username." });
      }

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });
      if (error) return json(400, { error: error.message });

      await admin.from("profiles").upsert({
        id: data.user.id,
        username,
        display_name: username,
        avatar: "◆",
      });

      const code = makeRecoveryCode();
      const codeHash = await hashCode(code);
      await admin.from("recovery_codes").upsert({
        user_id: data.user.id,
        code_hash: codeHash,
        used_at: null,
        created_at: new Date().toISOString(),
      });

      const pub = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: sessionData, error: signErr } = await pub.auth.signInWithPassword({
        email,
        password,
      });
      if (signErr || !sessionData.session) {
        return json(401, {
          error: signErr?.message ?? "Compte créé mais connexion échouée",
        });
      }

      return json(200, {
        session: sessionData.session,
        user: sessionData.user,
        recoveryCode: code,
      });
    }

    if (action === "signin") {
      if (password.length < 8) {
        return json(400, { error: "Mot de passe : 8 caractères minimum." });
      }
      if (!rateLimit(`signin:${username}`)) {
        return json(429, { error: "Trop de tentatives. Réessaie plus tard." });
      }

      const pub = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: sessionData, error: signErr } = await pub.auth.signInWithPassword({
        email,
        password,
      });
      if (signErr || !sessionData.session) {
        return json(401, { error: "Identifiants incorrects." });
      }

      await admin
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", sessionData.user.id);

      return json(200, {
        session: sessionData.session,
        user: sessionData.user,
      });
    }

    if (action === "recover") {
      if (newPassword.length < 8) {
        return json(400, { error: "Nouveau mot de passe : 8 caractères minimum." });
      }
      if (!recoveryCode || recoveryCode.length < 8) {
        return json(400, { error: "Code de récupération invalide." });
      }
      if (!rateLimit(`recover:${username}`)) {
        return json(429, { error: "Trop de tentatives de récupération." });
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (!profile) return json(400, { error: "Compte introuvable." });

      const { data: row } = await admin
        .from("recovery_codes")
        .select("code_hash, used_at")
        .eq("user_id", profile.id)
        .maybeSingle();
      if (!row || row.used_at) {
        return json(400, { error: "Code déjà utilisé ou absent. Crée un nouveau compte si besoin." });
      }

      const incoming = await hashCode(recoveryCode);
      if (incoming !== row.code_hash) {
        return json(401, { error: "Code de récupération incorrect." });
      }

      const { error: updErr } = await admin.auth.admin.updateUserById(profile.id, {
        password: newPassword,
      });
      if (updErr) return json(400, { error: updErr.message });

      // Rotate recovery code after use
      const nextCode = makeRecoveryCode();
      const nextHash = await hashCode(nextCode);
      await admin.from("recovery_codes").upsert({
        user_id: profile.id,
        code_hash: nextHash,
        used_at: null,
        created_at: new Date().toISOString(),
      });

      const pub = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: sessionData, error: signErr } = await pub.auth.signInWithPassword({
        email,
        password: newPassword,
      });
      if (signErr || !sessionData.session) {
        return json(200, {
          recovered: true,
          recoveryCode: nextCode,
          message: "Mot de passe mis à jour. Reconnecte-toi.",
        });
      }

      return json(200, {
        session: sessionData.session,
        user: sessionData.user,
        recoveryCode: nextCode,
        recovered: true,
      });
    }

    return json(400, { error: "action invalide" });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Erreur serveur" });
  }
});
