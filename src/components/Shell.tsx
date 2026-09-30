import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { usePresence } from "../lib/PresenceContext";
import "./Shell.css";

export function ShellLayout() {
  const { user, signOut, mode } = useAuth();
  const { online } = usePresence();
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [contentKey, setContentKey] = useState(
    location.pathname + location.search,
  );
  const isPlay = location.pathname.startsWith("/play/");

  useEffect(() => {
    setVisible(false);
    const t = window.setTimeout(() => {
      setContentKey(location.pathname + location.search);
      setVisible(true);
    }, 90);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const main = document.querySelector(".shell-main");
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname]);

  return (
    <div className={`shell ${isPlay ? "shell-play" : ""}`}>
      <header className="shell-bar">
        <Link to={user ? "/hub" : "/"} className="shell-brand" aria-label="RELAY">
          RELAY
        </Link>
        {user ? (
          <nav className="shell-nav" aria-label="Navigation">
            <NavLink to="/hub" end>
              Hub
            </NavLink>
            <NavLink to="/party">Party</NavLink>
            <NavLink to="/friends">Amis</NavLink>
            <NavLink to="/chat">Chat</NavLink>
            <NavLink to="/profile">Profil</NavLink>
            <span className="online-count" title="Joueurs en ligne">
              {online.length} en ligne
            </span>
            <span className="shell-user" style={{ color: user.accent }}>
              {user.avatar} @{user.username}
            </span>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => void signOut()}
            >
              Quitter
            </button>
          </nav>
        ) : (
          <nav className="shell-nav">
            <Link to="/auth" className="ghost-btn">
              Entrer
            </Link>
          </nav>
        )}
      </header>
      <main className="shell-main">
        <div
          key={contentKey}
          className={`route-view ${visible ? "is-in" : "is-out"}`}
        >
          <Outlet />
        </div>
      </main>
      {!isPlay && (
        <footer className="shell-foot">
          <span>Aucun email · Auth username · Chat & party live</span>
          <span className="mode-pill">
            {mode === "demo" ? "mode démo" : "supabase"}
          </span>
        </footer>
      )}
    </div>
  );
}
