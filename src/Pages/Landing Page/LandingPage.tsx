import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";

const STRIPE_PRO_LINK = "https://buy.stripe.com/3cI9AVgIO6ng7qz2Ii18c02";
const STRIPE_TEAM_LINK = "https://buy.stripe.com/6oU9AVdwC3b4h191Ee18c00";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const S = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const FEATURES = [
  {
    icon: <svg {...S}><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    title: "Real-Time Sync",
    desc: "Every cue advance is instantly visible across all connected devices. No refresh needed.",
  },
  {
    icon: <svg {...S}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
    title: "Custom Cue Fields",
    desc: "Define exactly the fields your team needs — text, times, notes, AV details.",
  },
  {
    icon: <svg {...S}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="8 3 3 6 8 9"/><polyline points="16 15 21 18 16 21"/></svg>,
    title: "Drag-to-Reorder",
    desc: "Rearrange cues at any time. Times cascade automatically so your schedule always adds up.",
  },
  {
    icon: <svg {...S}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    title: "Live Schedule Drift",
    desc: "See in real time whether you're running early, on time, or behind. Live ±min indicators.",
  },
  {
    icon: <svg {...S}><path d="M12 3c-1 2.5-3.5 4-6 4.5 2.5.5 5 2 6 4.5 1-2.5 3.5-4 6-4.5-2.5-.5-5-2-6-4.5z"/><path d="M5 14c-.6 1.5-1.8 2.5-3.5 3 1.7.5 2.9 1.5 3.5 3 .6-1.5 1.8-2.5 3.5-3-1.7-.5-2.9-1.5-3.5-3z"/></svg>,
    title: "AI Excel Import",
    desc: "Upload your existing spreadsheet. AI reads it and creates all your cues automatically.",
  },
  {
    icon: <svg {...S}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    title: "Viewer Field Controls",
    desc: "Crew members can show/hide fields so they only see what's relevant to their role.",
  },
  {
    icon: <svg {...S}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    title: "Shareable Link",
    desc: "One URL to share. Anyone can view the live cue sheet without creating an account.",
  },
  {
    icon: <svg {...S}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    title: "Works on Any Device",
    desc: "Optimized for phones, tablets, and desktop. Your stage manager, your TD, your crew.",
  },
  {
    icon: <svg {...S}><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>,
    title: "Live Broadcast",
    desc: "Send instant alerts to every viewer screen. Messages auto-expire so the feed stays clean.",
  },
];

const USE_CASES = [
  {
    icon: <svg {...S}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    name: "Houses of Worship",
  },
  {
    icon: <svg {...S}><circle cx="8" cy="13" r="4"/><circle cx="16" cy="13" r="4"/><path d="M8 9V5a4 4 0 0 1 8 0v4"/></svg>,
    name: "Weddings",
  },
  {
    icon: <svg {...S}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    name: "Corporate Events",
  },
  {
    icon: <svg {...S}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    name: "Concerts & Performances",
  },
  {
    icon: <svg {...S}><path d="M6 9H2V3h4v6zm16 0h-4V3h4v6z"/><path d="M21 9H3a9 9 0 0 0 9 9 9 9 0 0 0 9-9z"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
    name: "Live Sports",
  },
  {
    icon: <svg {...S}><polyline points="2 20 7 4 12 16 15 10 22 20"/></svg>,
    name: "Theater & Productions",
  },
  {
    icon: <svg {...S}><polyline points="22 10 12 5 2 10 12 15 22 10"/><line x1="6" y1="12.5" x2="6" y2="17.5"/><path d="M6 17.5a6 6 0 0 0 12 0"/></svg>,
    name: "Graduation Ceremonies",
  },
  {
    icon: <svg {...S}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    name: "Conferences & Summits",
  },
  {
    icon: <svg {...S}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    name: "Award Shows & Galas",
  },
  {
    icon: <svg {...S}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-1.408.07-3.13-1-4-1.071-.87-2.78-1.042-4 0z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg>,
    name: "Product Launches",
  },
];

function LandingPage() {
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
        <img
          className="lp-nav-logo"
          src={logo}
          alt="LiveCue"
          onClick={() => navigate("/")}
        />
        <ul className="lp-nav-links">
          <li><span onClick={() => scrollTo("how-it-works")}>How It Works</span></li>
          <li><span onClick={() => scrollTo("use-cases")}>Use Cases</span></li>
          <li><span onClick={() => scrollTo("features")}>Features</span></li>
          <li><span onClick={() => scrollTo("pricing")}>Pricing</span></li>
          <li><span onClick={() => navigate("/contact")}>Contact</span></li>
        </ul>
        <div className="lp-nav-cta">
          <button className="btn-nav-login" onClick={() => navigate("/login")}>Log in</button>
          <button className="btn-nav-signup" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-badge">
          <span className="lp-hero-badge-dot" />
          Introducing LiveCue
        </div>
        <h1 className="lp-hero-title">
          The show must go on.<br />
          <span className="lp-hero-highlight">Flawlessly.</span>
        </h1>
        <p className="lp-hero-sub">
          Real-time cue sheet coordination for live events of any scale.
          Plan, share, and run your program — all from one place.
        </p>
        <div className="lp-hero-actions">
          <button className="btn-primary-lp" onClick={() => navigate("/signup")}>
            Start for Free
          </button>
          <button className="btn-ghost-lp" onClick={() => navigate("/demo")}>
            Try Demo →
          </button>
        </div>
        <div className="lp-hero-scroll">
          <div className="lp-hero-scroll-line" />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="lp-stats-bar">
        {[
          { value: "Real-Time", label: "Live sync across all devices" },
          { value: "Zero Login", label: "For your crew to view" },
          { value: "Any Event", label: "Churches, concerts, corporate" },
          { value: "Always On", label: "Built for high-stakes moments" },
        ].map((s) => (
          <div className="lp-stat" key={s.label}>
            <span className="lp-stat-value">{s.value}</span>
            <span className="lp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── How It Works ── */}
      <section className="lp-section" id="how-it-works">
        <div className="lp-section-header">
          <p className="lp-eyebrow">Simple by design</p>
          <h2 className="lp-heading">From plan to live<br />in minutes.</h2>
          <p className="lp-body">
            No training required. LiveCue is built around the way event teams already work.
          </p>
        </div>
        <div className="lp-steps">
          {[
            { n: "01", title: "Create your event", desc: "Add a project with your event name, date, and time window. Takes 30 seconds." },
            { n: "02", title: "Build your cue sheet", desc: "Add cues with custom fields — presenter, location, AV notes, lighting, and anything else your team needs." },
            { n: "03", title: "Share with your crew", desc: "Share a single URL with everyone. No login required to view the live cue sheet." },
            { n: "04", title: "Run the show", desc: "Advance cues from the control room. Every screen updates instantly. Stay on time." },
          ].map((s) => (
            <div className="lp-step glass-card" key={s.n}>
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="lp-section lp-section--alt" id="use-cases">
        <div className="lp-section-header">
          <p className="lp-eyebrow">Built for every stage</p>
          <h2 className="lp-heading">Whatever your event,<br />LiveCue fits.</h2>
          <p className="lp-body">
            Teams across industries use LiveCue to coordinate complex programs with ease.
          </p>
        </div>
        <div className="lp-usecases">
          {USE_CASES.map((u) => (
            <div className="lp-usecase glass-card" key={u.name}>
              <div className="lp-usecase-icon">{u.icon}</div>
              <div className="lp-usecase-name">{u.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <div className="lp-section-header">
          <p className="lp-eyebrow">Everything you need</p>
          <h2 className="lp-heading">Professional tools.<br />Zero complexity.</h2>
          <p className="lp-body">
            LiveCue packs production-grade features into a clean interface your whole team can use.
          </p>
        </div>
        <div className="lp-features">
          {FEATURES.map((f) => (
            <div className="lp-feature glass-card" key={f.title}>
              <div className="lp-feature-icon">{f.icon}</div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="lp-section lp-section--alt" id="pricing">
        <div className="lp-section-header">
          <p className="lp-eyebrow">Simple pricing</p>
          <h2 className="lp-heading">Start free.<br />Scale as you grow.</h2>
          <p className="lp-body">No setup fees. No contracts. Cancel anytime.</p>
        </div>
        <div className="lp-pricing-cards">

          <div className="lp-price-card glass-card">
            <div className="lp-price-plan">Free</div>
            <div className="lp-price-amount">$0</div>
            <div className="lp-price-period">forever</div>
            <div className="lp-price-divider" />
            <ul className="lp-price-features">
              <li>1 project</li>
              <li>Up to 5 cues</li>
              <li>Shareable live view</li>
              <li>Basic cue fields</li>
            </ul>
            <button className="btn-price btn-price-outline" onClick={() => navigate("/signup")}>
              Get Started
            </button>
          </div>

          <div className="lp-price-card-wrap">
            <div className="lp-price-badge">Most Popular</div>
          <div className="lp-price-card lp-price-card--featured glass-card glass-card--glow">
            <div className="lp-price-plan lp-price-plan--accent">Pro</div>
            <div className="lp-price-amount lp-price-amount--white"><sup>$</sup>14</div>
            <div className="lp-price-period lp-price-period--dim">per month · $120/year</div>
            <div className="lp-price-divider lp-price-divider--dim" />
            <ul className="lp-price-features lp-price-features--white">
              <li>Unlimited projects & cues</li>
              <li>Custom cue fields</li>
              <li>AI Excel import (10/month)</li>
              <li>Live schedule drift</li>
              <li>Drag-to-reorder</li>
              <li>Shareable live view</li>
            </ul>
            <button className="btn-price btn-price-white" onClick={() => window.open(STRIPE_PRO_LINK, "_blank")}>
              Start Pro
            </button>
          </div>
          </div>

          <div className="lp-price-card glass-card">
            <div className="lp-price-plan">Team</div>
            <div className="lp-price-amount"><sup>$</sup>39</div>
            <div className="lp-price-period">per month · $349/year</div>
            <div className="lp-price-divider" />
            <ul className="lp-price-features">
              <li>Everything in Pro</li>
              <li>5 team seats</li>
              <li>AI Excel import (50/month)</li>
              <li>Priority support</li>
            </ul>
            <button className="btn-price btn-price-outline" onClick={() => window.open(STRIPE_TEAM_LINK, "_blank")}>
              Start Team
            </button>
          </div>

        </div>
        <p className="lp-pricing-note">
          Need a custom plan?{" "}
          <span onClick={() => navigate("/contact")}>Contact us</span>
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-inner glass-card glass-card--glow">
          <p className="lp-eyebrow">Ready when you are</p>
          <h2 className="lp-cta-title">Run a tighter show.<br />Starting today.</h2>
          <div className="lp-cta-actions">
            <button className="btn-primary-lp" onClick={() => navigate("/signup")}>
              Create Free Account
            </button>
            <button className="btn-ghost-lp" onClick={() => navigate("/contact")}>
              Talk to Us →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <img src={logo} alt="LiveCue" />
              <p>Real-time cue sheet coordination for live events of any scale.</p>
            </div>
            <div className="lp-footer-col">
              <h4>Product</h4>
              <ul>
                <li><span onClick={() => scrollTo("features")}>Features</span></li>
                <li><span onClick={() => scrollTo("pricing")}>Pricing</span></li>
                <li><span onClick={() => navigate("/demo")}>Demo</span></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Company</h4>
              <ul>
                <li><span onClick={() => navigate("/contact")}>Contact</span></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Account</h4>
              <ul>
                <li><span onClick={() => navigate("/login")}>Log In</span></li>
                <li><span onClick={() => navigate("/signup")}>Sign Up</span></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-divider" />
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} LiveCue. All rights reserved.</span>
            <span>Built for event professionals.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
