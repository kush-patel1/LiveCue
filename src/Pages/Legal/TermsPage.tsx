import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";
import "./Legal.css";

function TermsPage() {
  usePageTitle("Terms of Service");
  const navigate = useNavigate();
  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <img className="legal-nav-logo" src={logo} alt="LiveCue" onClick={() => navigate("/")} />
        <div className="legal-nav-links">
          <span onClick={() => navigate("/pricing")}>Pricing</span>
          <span onClick={() => navigate("/privacy")}>Privacy</span>
          <span onClick={() => navigate("/contact")}>Contact</span>
        </div>
      </nav>

      <div className="legal-body">
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-updated">Last updated: July 2, 2026</p>

        <p>
          These Terms of Service ("Terms") govern your access to and use of LiveCue
          ("LiveCue," "we," "us"), including the website at live-cue.com and related
          services (the "Service"). By creating an account or using the Service, you
          agree to these Terms. If you do not agree, do not use the Service.
        </p>

        <h2>1. Accounts</h2>
        <p>
          You must provide accurate information and are responsible for safeguarding
          your account credentials and for all activity under your account. You must
          be at least 16 years old to use the Service.
        </p>

        <h2>2. Subscriptions and billing</h2>
        <ul>
          <li>Paid plans (Pro and Team) are billed in advance on a monthly or annual basis through our payment processor, Stripe.</li>
          <li>Subscriptions renew automatically until canceled. You can cancel at any time from your account settings; access continues until the end of the current billing period.</li>
          <li>Except where required by law, payments are non-refundable. Prices may change with reasonable notice.</li>
          <li>Team plans include a fixed number of seats. You are responsible for the actions of members you invite.</li>
        </ul>

        <h2>3. Acceptable use</h2>
        <p>You agree not to misuse the Service, including by attempting to access it in an unauthorized way, disrupting it, uploading unlawful or infringing content, or using it to violate the rights of others.</p>

        <h2>4. Your content</h2>
        <p>
          You retain ownership of the cue sheets, event details, and other content you
          create ("Your Content"). You grant us a limited license to host and process
          Your Content solely to operate and improve the Service. You are responsible
          for Your Content and for any content you make publicly viewable via a share link.
        </p>

        <h2>5. Service availability</h2>
        <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that it will be uninterrupted, error-free, or suitable for a specific live event. You are responsible for maintaining backups of critical information.</p>

        <h2>6. Limitation of liability</h2>
        <p>To the maximum extent permitted by law, LiveCue will not be liable for any indirect, incidental, or consequential damages, or for any loss arising from your use of, or inability to use, the Service. Our total liability for any claim is limited to the amount you paid us in the twelve months preceding the claim.</p>

        <h2>7. Termination</h2>
        <p>You may stop using the Service at any time. We may suspend or terminate access if you violate these Terms. Upon termination, your right to use the Service ends.</p>

        <h2>8. Changes</h2>
        <p>We may update these Terms from time to time. Material changes will be posted here with an updated date. Continued use after changes take effect constitutes acceptance.</p>

        <h2>9. Contact</h2>
        <p>Questions about these Terms? Reach us via our <span style={{ color: "#7fa8b5", cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/contact")}>contact page</span>.</p>

        <div className="legal-note">
          This is a general starter template, not legal advice. Have a qualified
          attorney review these Terms before relying on them for your business.
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
