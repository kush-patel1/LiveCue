import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../Hooks/usePageTitle";
import logo from "../Assets/Logo/LIVECUE-Logo.png";
import "./Demo.css";

const SECTIONS = [
  {
    to: "/demo/editor",
    title: "Cue Sheet Editor",
    desc: "Build and edit a run of show — titles, times, presenters, AV and lighting. Try editing anything; nothing is saved.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    to: "/demo/admin",
    title: "Run of Show (Admin)",
    desc: "The live control room — advance cues, watch elapsed time and schedule drift, and broadcast messages to the crew.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    to: "/demo/live",
    title: "Live Cue Sheet (Viewer)",
    desc: "The audience-facing live view your whole team can open — current cue, what's next, and a running clock.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
];

function DemoHub() {
  usePageTitle("Interactive Demo");
  const navigate = useNavigate();

  return (
    <div className="demo-hub">
      <img className="demo-hub-logo" src={logo} alt="LiveCue" onClick={() => navigate("/")} />

      <div className="demo-hub-inner">
        <div className="demo-hero">
          <p className="demo-hero-eyebrow">Interactive Demo</p>
          <h1 className="demo-hero-title">See LiveCue in action</h1>
          <p className="demo-hero-sub">
            A fully interactive sandbox loaded with a sample show. Click into any
            view and edit freely — it's all in your browser, so nothing you do is
            saved or shared. No account needed.
          </p>
        </div>

        <div className="demo-cards">
          {SECTIONS.map((s) => (
            <button key={s.to} className="demo-card" onClick={() => navigate(s.to)}>
              <div className="demo-card-icon">{s.icon}</div>
              <h3 className="demo-card-title">{s.title}</h3>
              <p className="demo-card-desc">{s.desc}</p>
              <span className="demo-card-cta">
                Open
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </button>
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
      </div>
    </div>
  );
}

export default DemoHub;
