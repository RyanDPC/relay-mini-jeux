import { Link } from "react-router-dom";
import "./Landing.css";

export function Landing() {
  return (
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="brand-mark">RELAY</p>
          <h1>Ton dock multi-jeux. Sans email.</h1>
          <p className="lede">
            Compte username, liste d’amis, scores — rien de sensible. Lance des solos
            multi-genres depuis un mini launcher web.
          </p>
          <div className="cta-row">
            <Link className="primary-btn" to="/auth">
              Créer mon compte
            </Link>
            <Link className="ghost-btn" to="/auth?tab=in">
              Se connecter
            </Link>
          </div>
        </div>
        <div className="landing-visual" aria-hidden="true">
          <div className="orbit-ring" />
          <div className="orbit-core">
            <span>PULSE</span>
            <span>ECHO</span>
            <span>DRIFT</span>
          </div>
          <div className="scanline" />
        </div>
      </section>
  );
}
