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
          These Terms of Service ("Terms") are a binding legal agreement between you
          ("you," "your," or "User") and LiveCue ("LiveCue," "we," "us," or "our")
          governing your access to and use of the LiveCue website at live-cue.com, our
          applications, and all related products, features, and services (collectively,
          the "Service"). By accessing or using the Service, creating an account, or
          clicking to accept these Terms, you agree to be bound by these Terms and by our{" "}
          <span className="legal-inline-link" onClick={() => navigate("/privacy")}>Privacy Policy</span>,
          which is incorporated by reference. <strong>If you do not agree to these Terms,
          you must not access or use the Service.</strong>
        </p>

        <h2>1. Eligibility</h2>
        <p>
          You must be at least 16 years old (or the age of digital consent in your
          jurisdiction, if higher) and able to form a legally binding contract to use the
          Service. If you use the Service on behalf of an organization, you represent that
          you are authorized to bind that organization to these Terms, and "you" refers to
          both you and that organization.
        </p>

        <h2>2. The Service</h2>
        <p>
          LiveCue provides tools to plan, organize, share, and run cue sheets and
          run-of-show timelines for live events. The Service is provided for planning and
          coordination purposes only. We may add, change, suspend, or discontinue any part
          of the Service at any time, with or without notice.
        </p>

        <h2>3. Accounts and security</h2>
        <ul>
          <li>You must provide accurate, current, and complete information when creating an account and keep it updated.</li>
          <li>You are solely responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</li>
          <li>You must notify us immediately of any unauthorized use of your account or any other breach of security.</li>
          <li>We are not liable for any loss or damage arising from your failure to protect your account credentials.</li>
        </ul>

        <h2>4. Subscriptions, billing, and renewals</h2>
        <ul>
          <li><strong>Plans.</strong> The Service offers a free plan and paid plans (currently Pro and Team). Paid features are described on our pricing page and may change.</li>
          <li><strong>Payment processor.</strong> Payments are processed by Stripe, Inc. By purchasing a subscription, you also agree to Stripe's applicable terms. We do not receive or store your full payment card details.</li>
          <li><strong>Auto-renewal.</strong> Paid subscriptions are billed in advance on a recurring monthly or annual basis and <strong>automatically renew</strong> at the then-current price until canceled. You authorize us and Stripe to charge your payment method for each renewal.</li>
          <li><strong>Cancellation.</strong> You may cancel at any time from your account settings or the billing portal. Cancellation takes effect at the end of the current billing period; you retain access until then.</li>
          <li><strong>Price changes.</strong> We may change prices or introduce new fees. We will provide reasonable advance notice, and changes apply to the next billing cycle after the notice period.</li>
          <li><strong>Taxes.</strong> Fees are exclusive of taxes. You are responsible for any applicable sales, use, VAT, or similar taxes, other than taxes based on our net income.</li>
          <li><strong>Failed payments.</strong> If a charge fails, we may retry, suspend, or downgrade your access until payment is resolved.</li>
        </ul>

        <h2>5. Refunds</h2>
        <p>
          Except where required by applicable law, all payments are <strong>non-refundable</strong>,
          and we do not provide refunds or credits for partial billing periods, unused
          time, or features not used. This does not affect any statutory rights that cannot
          be waived.
        </p>

        <h2>6. Team plans</h2>
        <p>
          Team plans include a fixed number of seats. The account owner is responsible for
          all members they invite, for ensuring members are authorized to access shared
          content, and for all activity conducted through the team account. Removing a
          member or canceling the plan revokes the associated access.
        </p>

        <h2>7. Acceptable use</h2>
        <p>You agree not to, and not to permit anyone to:</p>
        <ul>
          <li>use the Service in violation of any applicable law, regulation, or third-party right;</li>
          <li>upload, share, or transmit content that is unlawful, infringing, defamatory, harassing, obscene, or harmful;</li>
          <li>attempt to gain unauthorized access to the Service, other accounts, or our systems, or probe, scan, or test the vulnerability of any system;</li>
          <li>interfere with or disrupt the integrity or performance of the Service, including via denial-of-service attacks, bots, or excessive automated requests;</li>
          <li>reverse engineer, decompile, or attempt to extract the source code of the Service, except to the extent permitted by law;</li>
          <li>resell, sublicense, or commercially exploit the Service without our written permission;</li>
          <li>use the Service to build a competing product or to send spam or unsolicited communications.</li>
        </ul>
        <p>We may investigate and take appropriate action, including suspending or terminating accounts, for any violation.</p>

        <h2>8. Your content</h2>
        <p>
          "Your Content" means the cue sheets, event details, text, and other materials you
          create, upload, or share through the Service. You retain all ownership rights in
          Your Content. You grant LiveCue a worldwide, non-exclusive, royalty-free license
          to host, store, reproduce, modify (for formatting), and display Your Content
          solely as necessary to operate, provide, secure, and improve the Service. You
          represent and warrant that you have all rights necessary to grant this license and
          that Your Content does not violate these Terms or any third-party rights. You are
          solely responsible for Your Content and for backing up anything important to you.
        </p>

        <h2>9. Public share links</h2>
        <p>
          The Service lets you generate links that make a project's live cue sheet viewable
          by anyone who has the link, without signing in. You are solely responsible for
          deciding what to share and with whom, and for any personal or sensitive
          information contained in shared content. You can disable a share link at any time.
          We are not responsible for content you choose to make publicly accessible.
        </p>

        <h2>10. Intellectual property</h2>
        <p>
          The Service, including its software, design, text, graphics, logos, and the
          "LiveCue" name and marks, is owned by LiveCue and protected by intellectual
          property laws. Except for the limited right to use the Service under these Terms,
          no rights are granted to you. You may not use our name, logos, or branding without
          our prior written consent.
        </p>

        <h2>11. Feedback</h2>
        <p>
          If you send us suggestions or feedback, you grant us a perpetual, irrevocable,
          worldwide, royalty-free license to use it for any purpose without obligation or
          compensation to you.
        </p>

        <h2>12. Third-party services</h2>
        <p>
          The Service relies on and may link to third-party services (including Stripe and
          Google Firebase). We are not responsible for the availability, content, or
          practices of third-party services, and your use of them may be subject to their
          own terms.
        </p>

        <h2>13. Disclaimer of warranties</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY
          KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE
          DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, ERROR-FREE,
          OR FREE OF DATA LOSS, OR THAT IT WILL MEET YOUR REQUIREMENTS. <strong>YOU
          ACKNOWLEDGE THAT THE SERVICE IS A PLANNING AND COORDINATION TOOL AND IS NOT
          GUARANTEED FOR USE IN LIVE, TIME-CRITICAL, OR MISSION-CRITICAL EVENTS. YOU ARE
          RESPONSIBLE FOR MAINTAINING INDEPENDENT BACKUPS AND CONTINGENCY PLANS.</strong>
          Some jurisdictions do not allow the exclusion of certain warranties, so some of the
          above may not apply to you.
        </p>

        <h2>14. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL LIVECUE OR ITS OWNERS,
          EMPLOYEES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS,
          REVENUE, DATA, GOODWILL, OR BUSINESS, ARISING OUT OF OR RELATED TO YOUR USE OF (OR
          INABILITY TO USE) THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE
          SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN
          THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) USD
          $50. THESE LIMITATIONS APPLY REGARDLESS OF THE THEORY OF LIABILITY AND FORM AN
          ESSENTIAL BASIS OF THE BARGAIN.
        </p>

        <h2>15. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless LiveCue and its owners,
          employees, and agents from and against any claims, liabilities, damages, losses,
          and expenses (including reasonable legal fees) arising out of or related to (a)
          Your Content, (b) your use of the Service, (c) your violation of these Terms or any
          law, or (d) your violation of any third-party right.
        </p>

        <h2>16. Termination</h2>
        <p>
          You may stop using the Service and delete your account at any time. We may suspend
          or terminate your access, with or without notice, if we believe you have violated
          these Terms, created risk or legal exposure for us, or for any other reason at our
          discretion. Upon termination, your right to use the Service ends immediately.
          Sections that by their nature should survive termination (including ownership,
          disclaimers, limitations of liability, indemnification, and dispute resolution)
          will survive.
        </p>

        <h2>17. Governing law and dispute resolution</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, USA, without regard
          to its conflict-of-laws rules. Subject to the arbitration provision below, you and
          LiveCue agree to the exclusive jurisdiction of the state and federal courts located
          in Delaware for any dispute not subject to arbitration.
        </p>
        <p>
          <strong>Binding arbitration; class-action waiver.</strong> To the fullest extent
          permitted by law, any dispute, claim, or controversy arising out of or relating to
          the Service or these Terms will be resolved by binding, individual arbitration and
          not in a class, collective, or representative action. You and LiveCue waive any
          right to a jury trial and to participate in a class action. You may opt out of this
          arbitration provision by notifying us in writing within 30 days of first accepting
          these Terms.
        </p>

        <h2>18. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material changes, we will
          update the "Last updated" date and, where appropriate, provide additional notice.
          Your continued use of the Service after changes become effective constitutes
          acceptance of the revised Terms.
        </p>

        <h2>19. General</h2>
        <ul>
          <li><strong>Entire agreement.</strong> These Terms and the Privacy Policy are the entire agreement between you and us regarding the Service.</li>
          <li><strong>Severability.</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
          <li><strong>No waiver.</strong> Our failure to enforce any provision is not a waiver of it.</li>
          <li><strong>Assignment.</strong> You may not assign these Terms without our consent; we may assign them freely.</li>
          <li><strong>Force majeure.</strong> We are not liable for delays or failures caused by events beyond our reasonable control.</li>
        </ul>

        <h2>20. Contact</h2>
        <p>
          Questions about these Terms? Reach us via our{" "}
          <span className="legal-inline-link" onClick={() => navigate("/contact")}>contact page</span>.
        </p>

        <div className="legal-note">
          This document is a good-faith draft intended to be comprehensive, but it is not
          legal advice and does not create an attorney–client relationship. Laws vary by
          jurisdiction. Please have a qualified attorney review and adapt it — including the
          governing-law, arbitration, and business-entity details — before you rely on it.
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
