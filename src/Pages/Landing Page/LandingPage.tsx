import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";

const STRIPE_PRO_LINK = "https://buy.stripe.com/test_placeholder_pro";
const STRIPE_TEAM_LINK = "https://buy.stripe.com/test_placeholder_team";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
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
        <p className="lp-hero-eyebrow">Real-Time Event Coordination</p>
        <h1 className="lp-hero-title">
          Run your event<br />with <span>perfect timing</span>.
        </h1>
        <p className="lp-hero-sub">
          LiveCue is the live cue sheet platform built for event professionals.
          Plan your program, coordinate your crew, and keep everyone on the
          same page — in real time.
        </p>
        <div className="lp-hero-actions">
          <button className="btn-primary-lp" onClick={() => navigate("/signup")}>
            Start for Free
          </button>
          <button className="btn-secondary-lp" onClick={() => navigate("/demo")}>
            Try Demo
          </button>
        </div>
        <div className="lp-hero-scroll-hint">Scroll to learn more</div>
      </section>

      {/* ── How It Works ── */}
      <section className="lp-section lp-section-white" id="how-it-works">
        <p className="lp-section-label" style={{ textAlign: "center" }}>Simple by design</p>
        <h2 className="lp-section-heading" style={{ textAlign: "center", margin: "0 auto 14px" }}>
          From plan to live in minutes
        </h2>
        <p className="lp-section-body" style={{ textAlign: "center", margin: "0 auto 60px" }}>
          No training required. LiveCue is built around the way event teams already work.
        </p>
        <div className="lp-steps">
          {[
            { n: "01", title: "Create your event", desc: "Add a project with your event name, date, and time window. Takes 30 seconds." },
            { n: "02", title: "Build your cue sheet", desc: "Add cues with custom fields — presenter, location, AV notes, lighting, and anything else your team needs." },
            { n: "03", title: "Share with your crew", desc: "Share a single URL with everyone. No login required to view the live cue sheet." },
            { n: "04", title: "Run the show", desc: "Advance cues from the admin panel. Every screen updates instantly. Stay on time." },
          ].map((s) => (
            <div className="lp-step" key={s.n}>
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="lp-section lp-section-dark" id="use-cases">
        <p className="lp-section-label" style={{ textAlign: "center" }}>Built for every stage</p>
        <h2 className="lp-section-heading" style={{ textAlign: "center", margin: "0 auto 14px", color: "white" }}>
          Whatever your event, LiveCue fits.
        </h2>
        <p className="lp-section-body" style={{ textAlign: "center", margin: "0 auto 56px", color: "rgba(255,255,255,0.55)" }}>
          Teams across industries use LiveCue to coordinate complex programs with ease.
        </p>
        <div className="lp-usecases">
          {[
            { icon: "🕌", name: "Houses of Worship" },
            { icon: "💒", name: "Weddings" },
            { icon: "🏢", name: "Corporate Events" },
            { icon: "🎤", name: "Concerts & Performances" },
            { icon: "🏟️", name: "Live Sports" },
            { icon: "🎭", name: "Theater & Productions" },
            { icon: "🎓", name: "Graduation Ceremonies" },
            { icon: "📋", name: "Conference & Summits" },
          ].map((u) => (
            <div className="lp-usecase" key={u.name}>
              <div className="lp-usecase-icon">{u.icon}</div>
              <div className="lp-usecase-name">{u.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section lp-section-white" id="features">
        <p className="lp-section-label" style={{ textAlign: "center" }}>Everything you need</p>
        <h2 className="lp-section-heading" style={{ textAlign: "center", margin: "0 auto 14px" }}>
          Professional tools, zero complexity.
        </h2>
        <p className="lp-section-body" style={{ textAlign: "center", margin: "0 auto 56px" }}>
          LiveCue packs production-grade features into a clean interface your whole team can use.
        </p>
        <div className="lp-features">
          {[
            { icon: "⚡", title: "Real-Time Sync", desc: "Every cue advance is instantly visible across all connected devices. No refresh needed." },
            { icon: "🧩", title: "Custom Cue Fields", desc: "Define exactly the fields your team needs — text, times, notes, AV details. No two events are alike." },
            { icon: "↕️", title: "Drag-to-Reorder", desc: "Rearrange cues at any time. Times cascade automatically so your schedule always adds up." },
            { icon: "📊", title: "Live Schedule Drift", desc: "See in real time whether you're running early, on time, or behind. Live ±min indicators on every cue." },
            { icon: "🤖", title: "AI Excel Import", desc: "Upload your existing cue sheet spreadsheet. AI reads it and creates all your cues automatically." },
            { icon: "👁️", title: "Viewer Field Controls", desc: "Crew members can show/hide fields on their screen so they only see what's relevant to their role." },
            { icon: "🔗", title: "Shareable Link", desc: "One URL to share. Anyone can view the live cue sheet without creating an account." },
            { icon: "📱", title: "Works on Any Device", desc: "Optimized for phones, tablets, and desktop. Your stage manager on an iPad, your TD on a laptop." },
          ].map((f) => (
            <div className="lp-feature" key={f.title}>
              <div className="lp-feature-icon">{f.icon}</div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing Teaser ── */}
      <section className="lp-section lp-section-cream" id="pricing">
        <div className="lp-pricing-teaser">
          <p className="lp-section-label">Simple pricing</p>
          <h2 className="lp-section-heading" style={{ margin: "0 auto 14px" }}>
            Start free. Scale as you grow.
          </h2>
          <p className="lp-section-body" style={{ margin: "0 auto" }}>
            No setup fees. No contracts. Cancel anytime.
          </p>
        </div>
        <div className="lp-pricing-cards">

          {/* Free */}
          <div className="lp-price-card">
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

          {/* Pro */}
          <div className="lp-price-card featured">
            <div className="lp-price-badge">Most Popular</div>
            <div className="lp-price-plan">Pro</div>
            <div className="lp-price-amount"><sup>$</sup>14</div>
            <div className="lp-price-period">per month · $120/year</div>
            <div className="lp-price-divider" />
            <ul className="lp-price-features">
              <li>Unlimited projects & cues</li>
              <li>Custom cue fields</li>
              <li>AI Excel import (10/month)</li>
              <li>Live schedule drift</li>
              <li>Drag-to-reorder</li>
              <li>Shareable live view</li>
            </ul>
            <button className="btn-price btn-price-primary" onClick={() => window.open(STRIPE_PRO_LINK, "_blank")}>
              Start Pro
            </button>
          </div>

          {/* Team */}
          <div className="lp-price-card">
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
            <button className="btn-price btn-price-terra" onClick={() => window.open(STRIPE_TEAM_LINK, "_blank")}>
              Start Team
            </button>
          </div>

        </div>
        <p style={{ textAlign: "center", marginTop: 28, fontFamily: "Inter-Regular", fontSize: 14, color: "var(--text-muted)" }}>
          Need a custom plan for a venue or production company?{" "}
          <span
            style={{ color: "var(--teal)", cursor: "pointer", fontFamily: "Inter-Medium" }}
            onClick={() => navigate("/contact")}
          >
            Contact us
          </span>
        </p>
      </section>

      {/* ── CTA Banner ── */}
      <div className="lp-cta-banner">
        <h2>Ready to run a tighter show?</h2>
        <p>Join event professionals who never miss a cue.</p>
        <div>
          <button className="btn-cta-white" onClick={() => navigate("/signup")}>
            Create Free Account
          </button>
          <button className="btn-cta-outline-white" onClick={() => navigate("/contact")}>
            Talk to Us
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <img src={logo} alt="LiveCue" />
            <p>Real-time cue sheet coordination for live events of any scale.</p>
          </div>
          <div className="lp-footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><span style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>Demo</span></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Company</h4>
            <ul>
              <li><span style={{ cursor: "pointer", fontFamily: "Inter-Regular", fontSize: 14, color: "rgba(255,255,255,0.45)" }} onClick={() => navigate("/contact")}>Contact</span></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Account</h4>
            <ul>
              <li><span style={{ cursor: "pointer", fontFamily: "Inter-Regular", fontSize: 14, color: "rgba(255,255,255,0.45)" }} onClick={() => navigate("/login")}>Log In</span></li>
              <li><span style={{ cursor: "pointer", fontFamily: "Inter-Regular", fontSize: 14, color: "rgba(255,255,255,0.45)" }} onClick={() => navigate("/signup")}>Sign Up</span></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-divider" />
        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} LiveCue. All rights reserved.</span>
          <span>Built for event professionals.</span>
        </div>
      </footer>
    </>
  );
}

export default LandingPage;
