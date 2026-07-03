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
          This Privacy Policy explains how LiveCue ("LiveCue," "we," "us," or "our")
          collects, uses, discloses, and protects personal information when you use the
          website at live-cue.com and related services (the "Service"). It also describes
          your rights and choices. By using the Service, you agree to the practices described
          here. If you do not agree, please do not use the Service.
        </p>

        <h2>1. Who we are</h2>
        <p>
          LiveCue is the controller responsible for the personal information described in
          this Policy. For any privacy questions or requests, contact us via our{" "}
          <span className="legal-inline-link" onClick={() => navigate("/contact")}>contact page</span>.
        </p>

        <h2>2. Information we collect</h2>
        <p>We collect information in three ways:</p>
        <ul>
          <li>
            <strong>Information you provide:</strong> your name and email address when you
            create an account; the projects, cue sheets, event details, and other content you
            create ("Your Content"); and the contents of messages you send us (for example,
            through the contact form or support requests).
          </li>
          <li>
            <strong>Information collected automatically:</strong> basic technical and usage
            data such as your device and browser type, approximate location derived from IP
            address, pages viewed, features used, referring URLs, and timestamps. This is
            collected through cookies and similar technologies (see Section 4).
          </li>
          <li>
            <strong>Information from third parties:</strong> our payment processor (Stripe)
            provides us with limited billing information such as a customer/subscription
            identifier, plan, billing status, and the last four digits and card brand — but
            not your full card number.
          </li>
        </ul>
        <p>
          We do not intentionally collect special categories of sensitive personal
          information, and we ask that you not include such information in Your Content.
        </p>

        <h2>3. How we use information</h2>
        <ul>
          <li>to provide, operate, maintain, and secure the Service;</li>
          <li>to create and manage your account and authenticate you;</li>
          <li>to process payments, manage subscriptions, and prevent fraud;</li>
          <li>to respond to your requests and provide customer support;</li>
          <li>to understand usage and improve the Service and develop new features;</li>
          <li>to send you service-related communications (for example, account, security, billing, or transactional messages);</li>
          <li>to detect, investigate, and prevent abuse, security incidents, and violations of our Terms;</li>
          <li>to comply with legal obligations and enforce our agreements.</li>
        </ul>

        <h2>4. Cookies and analytics</h2>
        <p>
          We and our providers use cookies, local storage, and similar technologies to keep
          you signed in, remember preferences, secure the Service, and understand usage. We
          use <strong>Google Analytics (via Firebase)</strong> to collect aggregated usage
          statistics that help us improve the Service. You can control cookies through your
          browser settings; disabling some cookies may affect functionality. Where required,
          we will seek consent for non-essential cookies.
        </p>

        <h2>5. Legal bases for processing (EEA/UK users)</h2>
        <p>If you are in the European Economic Area or the United Kingdom, we process your personal information on the following legal bases:</p>
        <ul>
          <li><strong>Performance of a contract</strong> — to provide the Service you request;</li>
          <li><strong>Legitimate interests</strong> — to secure, analyze, and improve the Service, where not overridden by your rights;</li>
          <li><strong>Consent</strong> — for non-essential cookies and certain communications, where required (you may withdraw consent at any time);</li>
          <li><strong>Legal obligation</strong> — to comply with applicable law.</li>
        </ul>

        <h2>6. How we share information</h2>
        <p>
          <strong>We do not sell your personal information, and we do not share it for
          cross-context behavioral advertising.</strong> We share information only as follows:
        </p>
        <ul>
          <li><strong>Service providers (subprocessors)</strong> who process data on our behalf under contract, including <strong>Google Firebase</strong> (authentication, database, hosting, analytics) and <strong>Stripe</strong> (payment processing);</li>
          <li><strong>Other users</strong>, where you choose to share content — for example, team members you invite or anyone you give a public share link to;</li>
          <li><strong>Legal and safety</strong> — when we believe disclosure is required by law, legal process, or to protect the rights, property, or safety of LiveCue, our users, or the public;</li>
          <li><strong>Business transfers</strong> — in connection with a merger, acquisition, financing, or sale of assets, subject to this Policy.</li>
        </ul>

        <h2>7. Public content and share links</h2>
        <p>
          When you enable a share link for a project, the associated cue sheet becomes
          viewable by anyone who has the link, without signing in. Do not include personal or
          sensitive information in content you intend to make public. You control sharing per
          project and can disable a link at any time from the run-of-show page.
        </p>

        <h2>8. Data retention</h2>
        <p>
          We retain personal information for as long as your account is active or as needed to
          provide the Service. When you delete your account, we delete or de-identify your
          associated personal information within a reasonable period, except where we must
          retain it to comply with legal, tax, accounting, or security obligations, resolve
          disputes, or enforce our agreements. Backups are purged on a rolling schedule.
        </p>

        <h2>9. Security</h2>
        <p>
          We use administrative, technical, and organizational safeguards designed to protect
          personal information, including encryption in transit and access controls. However,
          no method of transmission or storage is completely secure, and we cannot guarantee
          absolute security. You are responsible for keeping your account credentials
          confidential.
        </p>

        <h2>10. International data transfers</h2>
        <p>
          We and our providers may process and store information in the United States and
          other countries that may have data-protection laws different from those in your
          country. Where required, we rely on appropriate safeguards (such as Standard
          Contractual Clauses) for international transfers.
        </p>

        <h2>11. Your privacy rights</h2>
        <p>
          Depending on where you live, you may have some or all of the following rights
          regarding your personal information: to access, correct, update, or delete it; to
          port it; to object to or restrict certain processing; and to withdraw consent. To
          exercise these rights, contact us via our{" "}
          <span className="legal-inline-link" onClick={() => navigate("/contact")}>contact page</span>.
          We will respond as required by law. You may also access and update much of your
          account information directly in your settings, and you can delete your account at
          any time.
        </p>
        <ul>
          <li><strong>EEA/UK residents (GDPR):</strong> you have the rights described above and may lodge a complaint with your local supervisory authority.</li>
          <li><strong>California residents (CCPA/CPRA):</strong> you have the right to know, delete, and correct personal information, and to opt out of "sale" or "sharing." We do not sell or share personal information as those terms are defined. We will not discriminate against you for exercising your rights.</li>
        </ul>

        <h2>12. Do Not Track</h2>
        <p>
          Some browsers offer a "Do Not Track" signal. Because there is no common industry
          standard for responding to these signals, the Service does not currently respond to
          them.
        </p>

        <h2>13. Children's privacy</h2>
        <p>
          The Service is not directed to children under 16, and we do not knowingly collect
          personal information from them. If you believe a child has provided us personal
          information, contact us and we will delete it.
        </p>

        <h2>14. Third-party links</h2>
        <p>
          The Service may contain links to third-party websites or services that we do not
          control. This Policy does not apply to those third parties, and we encourage you to
          review their privacy policies.
        </p>

        <h2>15. Changes to this Policy</h2>
        <p>
          We may update this Policy from time to time. If we make material changes, we will
          update the "Last updated" date and, where appropriate, provide additional notice.
          Your continued use of the Service after changes take effect constitutes acceptance.
        </p>

        <h2>16. Contact</h2>
        <p>
          To ask a question or exercise a privacy right, reach us via our{" "}
          <span className="legal-inline-link" onClick={() => navigate("/contact")}>contact page</span>.
        </p>

        <div className="legal-note">
          This document is a good-faith draft intended to be comprehensive, but it is not
          legal advice. Privacy obligations vary by jurisdiction (for example, GDPR, UK GDPR,
          and CCPA/CPRA) and by how you actually process data. Please have a qualified
          attorney review and adapt it — and confirm your subprocessor list and retention
          practices — before you rely on it.
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
