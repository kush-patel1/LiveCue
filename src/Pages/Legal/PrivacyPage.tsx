import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";
import "./Legal.css";

function PrivacyPage() {
  usePageTitle("Privacy Policy");
  const navigate = useNavigate();
  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <img className="legal-nav-logo" src={logo} alt="LiveCue" onClick={() => navigate("/")} />
        <div className="legal-nav-links">
          <span onClick={() => navigate("/pricing")}>Pricing</span>
          <span onClick={() => navigate("/terms")}>Terms</span>
          <span onClick={() => navigate("/contact")}>Contact</span>
        </div>
      </nav>

      <div className="legal-body">
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated: July 2, 2026</p>

        <p>
          This Privacy Policy explains how LiveCue ("we," "us") collects, uses, and
          protects your information when you use live-cue.com and related services
          (the "Service").
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li><strong>Account information</strong> — your name and email address when you sign up.</li>
          <li><strong>Content</strong> — the projects, cue sheets, and event details you create.</li>
          <li><strong>Billing information</strong> — handled by our payment processor, Stripe. We do not store your full card details; we retain a Stripe customer/subscription identifier and your plan status.</li>
          <li><strong>Usage data</strong> — basic technical information such as browser type and interactions, used to operate and improve the Service.</li>
        </ul>

        <h2>2. How we use your information</h2>
        <ul>
          <li>To provide, maintain, and improve the Service.</li>
          <li>To process payments and manage subscriptions.</li>
          <li>To communicate with you about your account, security, and support requests.</li>
          <li>To detect, prevent, and address abuse or technical issues.</li>
        </ul>

        <h2>3. How we share information</h2>
        <p>
          We do not sell your personal information. We share it only with service
          providers who help us operate the Service, under appropriate safeguards:
        </p>
        <ul>
          <li><strong>Google Firebase</strong> — authentication, database, and hosting.</li>
          <li><strong>Stripe</strong> — payment processing.</li>
        </ul>
        <p>We may disclose information if required by law or to protect our rights and users.</p>

        <h2>4. Public share links</h2>
        <p>When you share a live cue sheet link, anyone with that link can view that project's cue sheet. You control sharing per project and can disable a link at any time from the run-of-show page.</p>

        <h2>5. Data retention</h2>
        <p>We retain your information for as long as your account is active. You may delete your account at any time from settings, which removes your associated data, subject to limited retention required for legal or accounting purposes.</p>

        <h2>6. Security</h2>
        <p>We use industry-standard measures, including encryption in transit, to protect your information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>

        <h2>7. Your rights</h2>
        <p>Depending on your location, you may have rights to access, correct, export, or delete your personal information. To exercise these rights, contact us via our <span style={{ color: "#7fa8b5", cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/contact")}>contact page</span>.</p>

        <h2>8. Children</h2>
        <p>The Service is not directed to children under 16, and we do not knowingly collect their personal information.</p>

        <h2>9. Changes</h2>
        <p>We may update this Policy from time to time. Material changes will be posted here with an updated date.</p>

        <div className="legal-note">
          This is a general starter template, not legal advice. Have a qualified
          attorney review this Policy — especially if you serve users in the EU
          (GDPR) or California (CCPA) — before relying on it.
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
