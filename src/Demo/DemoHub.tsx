import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../Hooks/usePageTitle";
import logo from "../Assets/Logo/LIVECUE-Logo.png";
import "../Pages/Pricing Page/PricingPage.css";
import "./Demo.css";

const SECTIONS = [
  {
    to: "/demo/editor",
    title: "Cue Sheet Editor",
    desc: "Build and edit a run of show — titles, times, presenters, AV and lighting. Try editing anything; nothing is saved.",
    cta: "Open editor",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    to: "/demo/admin",
    title: "Run of Show",
    desc: "The live control room — advance cues, watch elapsed time and schedule drift, and broadcast messages to the crew.",
    cta: "Open control room",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    to: "/demo/live",
    title: "Live Cue Sheet",
    desc: "The audience-facing live view your whole team can open — current cue, what's next, and a running clock.",
    cta: "Open live view",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
];

function DemoHub() {
  usePageTitle("Interactive Demo");
  const navigate = useNavigate();

  return (
    <div className="lp-root">

      {/* ── Ambient background ── */}
      <div className="lp-bg" aria-hidden="true">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        <div className="lp-orb lp-orb-4" />
      </div>

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <img className="lp-nav-logo" src={logo} alt="LiveCue" onClick={() => navigate("/")} />
        <ul className="lp-nav-links">
          <li><span onClick={() => navigate("/")}>Home</span></li>
          <li><span onClick={() => navigate("/pricing")}>Pricing</span></li>
          <li><span onClick={() => navigate("/contact")}>Contact</span></li>
        </ul>
        <div className="lp-nav-cta">
          <button className="btn-nav-login" onClick={() => navigate("/login")}>Log in</button>
          <button className="btn-nav-signup" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pp-hero">
        <p className="lp-eyebrow">Interactive Demo</p>
        <h1 className="pp-hero-title">See LiveCue in action.</h1>
        <p className="pp-hero-sub">
          A fully interactive sandbox loaded with a sample show. Click into any
          view and edit freely — it all runs in your browser, so nothing you do
          is saved or shared. No account needed.
        </p>
        <div className="pp-coming-soon-banner">
          <span className="pp-coming-soon-dot" />
          Sandbox mode — your edits are never saved
        </div>
      </section>

      {/* ── Demo section cards ── */}
      <section className="pp-cards-section">
        <div className="demo-hub-cards">
          {SECTIONS.map((s) => (
            <div key={s.to} className="pp-card glass-card demo-hub-card" onClick={() => navigate(s.to)}>
              <div className="demo-hub-card-icon">{s.icon}</div>
              <div className="pp-card-plan">{s.title}</div>
              <p className="pp-card-desc">{s.desc}</p>
              <div className="pp-card-divider" />
              <button className="pp-card-btn pp-card-btn--primary" onClick={(e) => { e.stopPropagation(); navigate(s.to); }}>
                {s.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="demo-hub-note">
          Ready to build your own?{" "}
          <span className="demo-hub-link" role="button" tabIndex={0}
            onClick={() => navigate("/signup")}
            onKeyDown={(e) => { if (e.key === "Enter") navigate("/signup"); }}>
            Start free
          </span>{" "}
          — no credit card required.
        </p>
      </section>
    </div>
  );
}

export default DemoHub;
