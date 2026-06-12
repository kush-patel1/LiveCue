import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PricingPage.css";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";

const STRIPE_PRO_MONTHLY = "https://buy.stripe.com/test_placeholder_pro_monthly";
const STRIPE_PRO_ANNUAL = "https://buy.stripe.com/test_placeholder_pro_annual";
const STRIPE_TEAM_MONTHLY = "https://buy.stripe.com/test_placeholder_team_monthly";
const STRIPE_TEAM_ANNUAL = "https://buy.stripe.com/test_placeholder_team_annual";

const PLANS = {
  monthly: {
    pro: { price: "14", period: "per month", annual: "Save $48 with annual", link: STRIPE_PRO_MONTHLY },
    team: { price: "39", period: "per month", annual: "Save $119 with annual", link: STRIPE_TEAM_MONTHLY },
  },
  annual: {
    pro: { price: "10", period: "per month, billed $120/yr", annual: "You're saving $48", link: STRIPE_PRO_ANNUAL },
    team: { price: "29", period: "per month, billed $349/yr", annual: "You're saving $119", link: STRIPE_TEAM_ANNUAL },
  },
};

function PricingPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const plan = PLANS[billing];

  return (
    <div className="pricing-page">
      {/* Nav */}
      <nav className="pricing-nav">
        <img className="pricing-nav-logo" src={logo} alt="LiveCue" onClick={() => navigate("/")} />
        <div className="pricing-nav-links">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
          <button onClick={() => navigate("/login")}>Log In</button>
          <button className="btn-pricing-nav" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="pricing-hero">
        <h1>Simple, transparent pricing.</h1>
        <p>No hidden fees. No long-term contracts. Start free and upgrade when you're ready.</p>
        <div className="pricing-toggle">
          <button className={billing === "monthly" ? "active" : ""} onClick={() => setBilling("monthly")}>
            Monthly
          </button>
          <button className={billing === "annual" ? "active" : ""} onClick={() => setBilling("annual")}>
            Annual · Save up to 25%
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="pricing-cards-grid">

        {/* Free */}
        <div className="pricing-card">
          <div className="pricing-card-plan">Free</div>
          <div className="pricing-card-amount">$0</div>
          <div className="pricing-card-period">forever</div>
          <div className="pricing-card-annual" style={{ visibility: "hidden" }}>—</div>
          <div className="pricing-card-desc">
            Perfect for exploring LiveCue or running a small one-time event.
          </div>
          <div className="pricing-card-divider" />
          <ul className="pricing-card-features">
            <li><span className="feat-check">✓</span> 1 project</li>
            <li><span className="feat-check">✓</span> Up to 5 cues per project</li>
            <li><span className="feat-check">✓</span> Shareable live cue sheet</li>
            <li><span className="feat-check">✓</span> Basic cue fields</li>
            <li className="dimmed"><span className="feat-x">✗</span> Custom fields</li>
            <li className="dimmed"><span className="feat-x">✗</span> AI Excel import</li>
            <li className="dimmed"><span className="feat-x">✗</span> Drag-to-reorder</li>
            <li className="dimmed"><span className="feat-x">✗</span> Live schedule drift</li>
          </ul>
          <button className="btn-pricing-outline" onClick={() => navigate("/signup")}>
            Get Started Free
          </button>
        </div>

        {/* Pro */}
        <div className="pricing-card featured">
          <div className="pricing-card-badge">Most Popular</div>
          <div className="pricing-card-plan">Pro</div>
          <div className="pricing-card-amount"><sup>$</sup>{plan.pro.price}</div>
          <div className="pricing-card-period">{plan.pro.period}</div>
          <div className="pricing-card-annual">{plan.pro.annual}</div>
          <div className="pricing-card-desc">
            For professional event planners, coordinators, and solo producers.
          </div>
          <div className="pricing-card-divider" />
          <ul className="pricing-card-features">
            <li><span className="feat-check">✓</span> Unlimited projects</li>
            <li><span className="feat-check">✓</span> Unlimited cues</li>
            <li><span className="feat-check">✓</span> Custom cue fields per project</li>
            <li><span className="feat-check">✓</span> Drag-to-reorder with auto time cascade</li>
            <li><span className="feat-check">✓</span> Live schedule drift indicators</li>
            <li><span className="feat-check">✓</span> AI Excel import (10/month)</li>
            <li><span className="feat-check">✓</span> Shareable live cue sheet</li>
            <li><span className="feat-check">✓</span> Viewer field show/hide controls</li>
          </ul>
          <button className="btn-pricing-primary" onClick={() => window.open(plan.pro.link, "_blank")}>
            Start Pro
          </button>
        </div>

        {/* Team */}
        <div className="pricing-card">
          <div className="pricing-card-plan">Team</div>
          <div className="pricing-card-amount"><sup>$</sup>{plan.team.price}</div>
          <div className="pricing-card-period">{plan.team.period}</div>
          <div className="pricing-card-annual">{plan.team.annual}</div>
          <div className="pricing-card-desc">
            For organizations, venues, and production teams with multiple coordinators.
          </div>
          <div className="pricing-card-divider" />
          <ul className="pricing-card-features">
            <li><span className="feat-check">✓</span> Everything in Pro</li>
            <li><span className="feat-check">✓</span> 5 team seats</li>
            <li><span className="feat-check">✓</span> AI Excel import (50/month)</li>
            <li><span className="feat-check">✓</span> Priority support</li>
            <li><span className="feat-check">✓</span> Team billing management</li>
          </ul>
          <button className="btn-pricing-terra" onClick={() => window.open(plan.team.link, "_blank")}>
            Start Team
          </button>
        </div>

      </div>

      {/* FAQ */}
      <section className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          {[
            {
              q: "Can I switch plans anytime?",
              a: "Yes. Upgrade, downgrade, or cancel at any time. Billing adjusts automatically at your next cycle.",
            },
            {
              q: "What counts as an AI import?",
              a: "Each time you upload a spreadsheet and generate cues from it counts as one import. Previewing without confirming does not count.",
            },
            {
              q: "Do viewers need an account?",
              a: "No. Anyone with the shareable link can view the live cue sheet without signing up or logging in.",
            },
            {
              q: "What happens when I hit the free tier limits?",
              a: "You can still view and run your existing project. To create a new project or add more cues, you'll be prompted to upgrade.",
            },
            {
              q: "Is my data secure?",
              a: "All data is stored in Firebase (Google Cloud infrastructure) with per-user access controls. Your cue sheets are private to your account.",
            },
            {
              q: "Do you offer discounts for nonprofits?",
              a: "Yes — houses of worship, nonprofits, and educational institutions can contact us for a discounted rate.",
            },
          ].map((f) => (
            <div className="faq-item" key={f.q}>
              <h4>{f.q}</h4>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{ background: "#578493", padding: "72px 6%", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Inter-ExtraBold", fontSize: "clamp(24px, 3vw, 40px)", color: "white", marginBottom: 14 }}>
          Still have questions?
        </h2>
        <p style={{ fontFamily: "Inter-Regular", fontSize: 17, color: "rgba(255,255,255,0.8)", marginBottom: 32 }}>
          We're happy to walk you through the platform or find the right plan for your team.
        </p>
        <button
          onClick={() => navigate("/contact")}
          style={{ fontFamily: "Inter-SemiBold", fontSize: 15, background: "white", color: "#578493", border: "none", borderRadius: 10, padding: "13px 28px", cursor: "pointer" }}
        >
          Contact Us
        </button>
      </div>

      {/* Footer */}
      <footer style={{ background: "#141414", padding: "32px 6%", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontFamily: "Inter-Regular", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          © {new Date().getFullYear()} LiveCue. All rights reserved.
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          <span
            onClick={() => navigate("/")}
            style={{ fontFamily: "Inter-Regular", fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
          >
            Home
          </span>
          <span
            onClick={() => navigate("/contact")}
            style={{ fontFamily: "Inter-Regular", fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
          >
            Contact
          </span>
        </div>
      </footer>
    </div>
  );
}

export default PricingPage;
