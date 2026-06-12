import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ContactPage.css";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";

function ContactPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", eventType: "", subject: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    setSubmitted(true);
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
          <li><span onClick={() => navigate("/pricing")}>Pricing</span></li>
          <li><span onClick={() => navigate("/")}>Features</span></li>
        </ul>
        <div className="lp-nav-cta">
          <button className="btn-nav-login" onClick={() => navigate("/login")}>Log in</button>
          <button className="btn-nav-signup" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="cp-hero">
        <p className="lp-eyebrow">Get in touch</p>
        <h1 className="cp-hero-title">Let's talk.</h1>
        <p className="cp-hero-sub">
          Questions about plans, custom pricing, or how LiveCue fits your organization?
          We'd love to hear from you.
        </p>
      </section>

      {/* ── Body ── */}
      <section className="cp-body">

        {/* Left: info */}
        <div className="cp-info glass-card">
          <h3 className="cp-info-heading">How can we help?</h3>
          <p className="cp-info-body">
            Whether you're a house of worship running weekly services, a wedding planner
            coordinating ceremonies, or a production company managing large-scale events —
            we're here to make LiveCue work perfectly for your team.
          </p>

          <div className="cp-info-items">
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
                title: "Sales & Pricing",
                desc: "Custom plans for large organizations and venues.",
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
                title: "Support",
                desc: "Technical questions, account issues, feature requests.",
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: "Partnerships",
                desc: "Venue partnerships, reseller inquiries, integrations.",
              },
            ].map((item) => (
              <div className="cp-info-item" key={item.title}>
                <div className="cp-info-item-icon">{item.icon}</div>
                <div>
                  <div className="cp-info-item-title">{item.title}</div>
                  <div className="cp-info-item-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="cp-tags-block">
            <p className="cp-tags-label">We work with teams running</p>
            <div className="cp-tags">
              {["Houses of Worship","Weddings","Corporate Events","Concerts","Live Sports","Theater","Graduations","Conferences"].map((u) => (
                <span className="cp-tag glass-card" key={u}>{u}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="cp-form-card glass-card">
          {submitted ? (
            <div className="cp-success">
              <div className="cp-success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="cp-success-title">Message sent!</h3>
              <p className="cp-success-body">Thanks for reaching out. We'll get back to you within 1 business day.</p>
            </div>
          ) : (
            <>
              <h3 className="cp-form-heading">Send us a message</h3>
              <form onSubmit={handleSubmit} className="cp-form">
                <div className="cp-form-row">
                  <div className="cp-field">
                    <label>First Name</label>
                    <input required name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} />
                  </div>
                  <div className="cp-field">
                    <label>Last Name</label>
                    <input required name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} />
                  </div>
                </div>
                <div className="cp-field">
                  <label>Email</label>
                  <input required type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
                </div>
                <div className="cp-field">
                  <label>Event Type</label>
                  <select name="eventType" value={form.eventType} onChange={handleChange}>
                    <option value="">Select your event type...</option>
                    <option value="worship">House of Worship</option>
                    <option value="wedding">Wedding</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="concert">Concert / Performance</option>
                    <option value="sports">Live Sports</option>
                    <option value="theater">Theater / Production</option>
                    <option value="graduation">Graduation</option>
                    <option value="conference">Conference / Summit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="cp-field">
                  <label>Subject</label>
                  <input required name="subject" placeholder="What's this about?" value={form.subject} onChange={handleChange} />
                </div>
                <div className="cp-field">
                  <label>Message</label>
                  <textarea required name="message" rows={5} placeholder="Tell us about your event and how we can help..." value={form.message} onChange={handleChange} />
                </div>
                <button className="btn-cp-submit" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </>
          )}
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

export default ContactPage;
