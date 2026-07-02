import { useNavigate } from "react-router-dom";
import "./Demo.css";

interface DemoBannerProps {
  /** Optional label for the current section, e.g. "Cue Sheet Editor" */
  section?: string;
}

/**
 * Fixed banner shown on every demo screen. Makes it unmistakable that this is
 * a sandbox where nothing is saved, and offers a fast path to sign up.
 */
export function DemoBanner({ section }: DemoBannerProps) {
  const navigate = useNavigate();
  return (
    <div className="demo-banner">
      <div className="demo-banner-left">
        <span className="demo-banner-dot" />
        <span className="demo-banner-text">
          <strong>Demo{section ? ` · ${section}` : ""}</strong>
          <span className="demo-banner-sub">Sandbox — edits are not saved</span>
        </span>
      </div>
      <div className="demo-banner-actions">
        <button className="demo-banner-btn demo-banner-btn--ghost" onClick={() => navigate("/demo")}>
          Demo home
        </button>
        <button className="demo-banner-btn demo-banner-btn--solid" onClick={() => navigate("/signup")}>
          Start free
        </button>
      </div>
    </div>
  );
}
