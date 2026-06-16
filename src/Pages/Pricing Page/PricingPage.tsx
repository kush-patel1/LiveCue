import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PricingPage.css";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";

const PAYMENT_LINKS = {
  pro_monthly:  "https://buy.stripe.com/3cI9AVgIO6ng7qz2Ii18c02",
  pro_annual:   "https://buy.stripe.com/cNi14p78edPI8uDciS18c03",
  team_monthly: "https://buy.stripe.com/6oU9AVdwC3b4h191Ee18c00",
  team_annual:  "https://buy.stripe.com/aFadRb0JQeTM7qzfv418c01",
} as const;

type PriceKey = keyof typeof PAYMENT_LINKS;

const PLANS = {
  monthly: {
    pro:  { price: "14", period: "per month",                 savings: "Save $48 with annual",   priceKey: "pro_monthly"  as PriceKey },
    team: { price: "39", period: "per month",                 savings: "Save $119 with annual",  priceKey: "team_monthly" as PriceKey },
  },
  annual: {
    pro:  { price: "10", period: "per month, billed $120/yr", savings: "You're saving $48",      priceKey: "pro_annual"   as PriceKey },
    team: { price: "29", period: "per month, billed $349/yr", savings: "You're saving $119",     priceKey: "team_annual"  as PriceKey },
  },
};

const FREE_FEATURES  = ["1 project","Up to 5 cues per project","Shareable live cue sheet","Basic cue fields"];
const FREE_MISSING   = ["Custom fields","AI Excel import","Drag-to-reorder","Live schedule drift"];
const PRO_FEATURES   = ["Unlimited projects","Unlimited cues","Custom cue fields per project","Drag-to-reorder with auto time cascade","Live schedule drift indicators","AI Excel import (10/month)","Shareable live cue sheet","Viewer field show/hide controls"];
const TEAM_FEATURES  = ["Everything in Pro","5 team seats","AI Excel import (50/month)","Priority support","Team billing management"];

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const CROSS = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function PricingPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<PriceKey | null>(null);
  const plan = PLANS[billing];

  const isLoggedIn = !!sessionStorage.getItem("CURRENT_USER");

  const handleCheckout = (priceKey: PriceKey) => {
    if (!isLoggedIn) {
      navigate(`/signup?plan=${priceKey}`);
      return;
    }
    setCheckoutLoading(priceKey);
    window.location.href = PAYMENT_LINKS[priceKey];
  };

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
          <li><span onClick={() => navigate("/contact")}>Contact</span></li>
          <li><span onClick={() => navigate("/")}>Features</span></li>
        </ul>
        <div className="lp-nav-cta">
          <button className="btn-nav-login" onClick={() => navigate("/login")}>Log in</button>
          <button className="btn-nav-signup" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pp-hero">
        <p className="lp-eyebrow">Pricing</p>
        <h1 className="pp-hero-title">Simple, transparent pricing.</h1>
        <p className="pp-hero-sub">
          No hidden fees. No long-term contracts. Start free and upgrade when you're ready.
        </p>

        {/* Billing toggle */}
        <div className="pp-toggle glass-card">
          <button
            className={`pp-toggle-btn${billing === "monthly" ? " active" : ""}`}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            className={`pp-toggle-btn${billing === "annual" ? " active" : ""}`}
            onClick={() => setBilling("annual")}
          >
            Annual
            <span className="pp-toggle-badge">Save 25%</span>
          </button>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="pp-cards-section">
        <div className="pp-cards">

          {/* Free */}
          <div className="pp-card glass-card">
            <div className="pp-card-plan">Free</div>
            <div className="pp-card-price-row">
              <span className="pp-card-amount">$0</span>
              <span className="pp-card-period">/ forever</span>
            </div>
            <p className="pp-card-desc">
              Perfect for exploring LiveCue or running a small one-time event.
            </p>
            <div className="pp-card-divider" />
            <ul className="pp-card-features">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="pp-feat pp-feat--yes"><span className="pp-feat-icon pp-feat-icon--yes">{CHECK}</span>{f}</li>
              ))}
              {FREE_MISSING.map((f) => (
                <li key={f} className="pp-feat pp-feat--no"><span className="pp-feat-icon pp-feat-icon--no">{CROSS}</span>{f}</li>
              ))}
            </ul>
            <button className="pp-card-btn pp-card-btn--outline" onClick={() => navigate("/signup")}>
              Get Started Free
            </button>
          </div>

          {/* Pro (featured) */}
          <div className="pp-card-wrap">
            <div className="pp-badge">Most Popular</div>
            <div className="pp-card glass-card glass-card--glow pp-card--featured">
              <div className="pp-card-plan pp-card-plan--featured">Pro</div>
              <div className="pp-card-price-row">
                <span className="pp-card-currency">$</span>
                <span className="pp-card-amount">{plan.pro.price}</span>
                <span className="pp-card-period">/ {plan.pro.period}</span>
              </div>
              <p className="pp-card-savings">{plan.pro.savings}</p>
              <p className="pp-card-desc">
                For professional event planners, coordinators, and solo producers.
              </p>
              <div className="pp-card-divider" />
              <ul className="pp-card-features">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="pp-feat pp-feat--yes"><span className="pp-feat-icon pp-feat-icon--yes">{CHECK}</span>{f}</li>
                ))}
              </ul>
              <button
                className="pp-card-btn pp-card-btn--primary"
                onClick={() => handleCheckout(plan.pro.priceKey)}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === plan.pro.priceKey ? "Redirecting…" : "Start Pro"}
              </button>
            </div>
          </div>

          {/* Team */}
          <div className="pp-card glass-card">
            <div className="pp-card-plan">Team</div>
            <div className="pp-card-price-row">
              <span className="pp-card-currency">$</span>
              <span className="pp-card-amount">{plan.team.price}</span>
              <span className="pp-card-period">/ {plan.team.period}</span>
            </div>
            <p className="pp-card-savings">{plan.team.savings}</p>
            <p className="pp-card-desc">
              For organizations, venues, and production teams with multiple coordinators.
            </p>
            <div className="pp-card-divider" />
            <ul className="pp-card-features">
              {TEAM_FEATURES.map((f) => (
                <li key={f} className="pp-feat pp-feat--yes"><span className="pp-feat-icon pp-feat-icon--yes">{CHECK}</span>{f}</li>
              ))}
            </ul>
            <button
              className="pp-card-btn pp-card-btn--teal"
              onClick={() => handleCheckout(plan.team.priceKey)}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === plan.team.priceKey ? "Redirecting…" : "Start Team"}
            </button>
          </div>

        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pp-faq">
        <div className="pp-faq-inner">
          <p className="lp-eyebrow" style={{ textAlign: "center" }}>FAQ</p>
          <h2 className="pp-faq-title">Frequently asked questions</h2>
          <div className="pp-faq-grid">
            {[
              { q: "Can I switch plans anytime?",           a: "Yes. Upgrade, downgrade, or cancel at any time. Billing adjusts automatically at your next cycle." },
              { q: "What counts as an AI import?",          a: "Each time you upload a spreadsheet and generate cues from it counts as one import. Previewing without confirming does not count." },
              { q: "Do viewers need an account?",           a: "No. Anyone with the shareable link can view the live cue sheet without signing up or logging in." },
              { q: "What happens at the free tier limits?", a: "You can still view and run your existing project. To create more projects or add more cues, you'll be prompted to upgrade." },
              { q: "Is my data secure?",                    a: "All data is stored in Firebase (Google Cloud infrastructure) with per-user access controls. Your cue sheets are private to your account." },
              { q: "Discounts for nonprofits?",             a: "Yes — houses of worship, nonprofits, and educational institutions can contact us for a discounted rate." },
            ].map(({ q, a }) => (
              <div className="pp-faq-item glass-card" key={q}>
                <h4 className="pp-faq-q">{q}</h4>
                <p className="pp-faq-a">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pp-cta">
        <div className="pp-cta-card glass-card glass-card--glow">
          <p className="lp-eyebrow" style={{ textAlign: "center" }}>Still deciding?</p>
          <h2 className="pp-cta-title">Have questions? We're here.</h2>
          <p className="pp-cta-body">
            We're happy to walk you through the platform or find the right plan for your team.
          </p>
          <div className="pp-cta-btns">
            <button className="pp-cta-btn-primary" onClick={() => navigate("/contact")}>Contact Us</button>
            <button className="pp-cta-btn-ghost" onClick={() => navigate("/signup")}>Start for Free</button>
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
                <li><span onClick={() => navigate("/")}>Features</span></li>
                <li><span onClick={() => navigate("/pricing")}>Pricing</span></li>
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

export default PricingPage;
