import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import "./Auth.css";

type Tab = "in" | "up" | "recover";

export function AuthPage() {
  const { user, signIn, signUp, recover, mode, lastRecoveryCode, clearRecoveryCode } =
    useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initial: Tab =
    params.get("tab") === "in" ? "in" : params.get("tab") === "recover" ? "recover" : "up";
  const [tab, setTab] = useState<Tab>(initial);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(() =>
    Boolean(sessionStorage.getItem("relay.pendingRecoveryCode")),
  );
  const [localRecoveryCode, setLocalRecoveryCode] = useState<string | null>(() =>
    sessionStorage.getItem("relay.pendingRecoveryCode"),
  );

  const title = useMemo(() => {
    if (tab === "up") return "Créer un compte";
    if (tab === "recover") return "Récupérer mon compte";
    return "Se connecter";
  }, [tab]);

  const pendingCode =
    localRecoveryCode ??
    lastRecoveryCode ??
    (typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("relay.pendingRecoveryCode")
      : null);

  if (user && !showCode && !pendingCode) {
    return <Navigate to="/hub" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === "up") {
        const result = await signUp(username, password);
        const code =
          result.recoveryCode ??
          sessionStorage.getItem("relay.pendingRecoveryCode") ??
          lastRecoveryCode;
        if (code) {
          setLocalRecoveryCode(code);
          setShowCode(true);
        }
        return;
      }
      if (tab === "recover") {
        const result = await recover(username, recoveryCode, newPassword);
        const code =
          result.recoveryCode ??
          sessionStorage.getItem("relay.pendingRecoveryCode") ??
          lastRecoveryCode;
        if (code) {
          setLocalRecoveryCode(code);
          setShowCode(true);
        }
        return;
      }
      await signIn(username, password);
      navigate("/hub", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setBusy(false);
    }
  };

  const codeToShow = pendingCode;

  if ((showCode || pendingCode) && codeToShow) {
    return (
        <section className="auth-panel">
          <p className="eyebrow">RELAY · code de récupération</p>
          <h1>Note ce code</h1>
          <p className="hint">
            Sans email : ce code est le seul moyen de réinitialiser ton mot de passe.
            Stocke-le hors ligne. Il ne sera plus réaffiché.
          </p>
          <p className="recovery-code" aria-live="polite">
            {codeToShow}
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              clearRecoveryCode();
              sessionStorage.removeItem("relay.pendingRecoveryCode");
              setLocalRecoveryCode(null);
              setShowCode(false);
              navigate("/hub", { replace: true });
            }}
          >
            J’ai noté mon code — entrer
          </button>
        </section>
    );
  }

  return (
      <section className="auth-panel">
        <div className="auth-head">
          <p className="eyebrow">RELAY · accès</p>
          <h1>{title}</h1>
          <p className="hint">
            Username + mot de passe uniquement. Récupération via code secret — jamais
            d’email.
          </p>
        </div>

        <div className="auth-tabs three" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "up"}
            className={tab === "up" ? "active" : ""}
            onClick={() => setTab("up")}
          >
            Inscription
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "in"}
            className={tab === "in" ? "active" : ""}
            onClick={() => setTab("in")}
          >
            Connexion
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "recover"}
            className={tab === "recover" ? "active" : ""}
            onClick={() => setTab("recover")}
          >
            Code
          </button>
        </div>

        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex. nova_42"
              required
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]+"
            />
          </div>

          {tab !== "recover" && (
            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                autoComplete={tab === "up" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          )}

          {tab === "recover" && (
            <>
              <div className="field">
                <label htmlFor="recovery">Code de récupération</label>
                <input
                  id="recovery"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="XXXXX-XXXXX"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="newpass">Nouveau mot de passe</label>
                <input
                  id="newpass"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </>
          )}

          {error && <div className="error-banner">{error}</div>}
          <button className="primary-btn" type="submit" disabled={busy}>
            {busy
              ? "…"
              : tab === "up"
                ? "Rejoindre RELAY"
                : tab === "recover"
                  ? "Réinitialiser"
                  : "Entrer"}
          </button>
        </form>

        <p className="hint auth-note">
          Mode actuel : <strong>{mode}</strong>
          {mode === "demo"
            ? " — données locales."
            : " — Auth + RLS + rate-limit."}{" "}
          <Link to="/">Retour</Link>
        </p>
      </section>
  );
}
