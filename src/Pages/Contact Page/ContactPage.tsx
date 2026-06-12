import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ContactPage.css";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";

function ContactPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    eventType: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate send — replace with EmailJS / Formspree / Firebase Function
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="contact-page">
      {/* Nav */}
      <nav className="contact-nav">
        <img className="contact-nav-logo" src={logo} alt="LiveCue" onClick={() => navigate("/")} />
        <div className="contact-nav-links">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/pricing")}>Pricing</button>
          <button onClick={() => navigate("/login")}>Log In</button>
          <button className="btn-contact-nav" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="contact-hero">
        <h1>Let's talk.</h1>
        <p>
          Questions about plans, custom pricing, or how LiveCue fits your
          organization? We'd love to hear from you.
        </p>
      </div>

      {/* Body */}
      <div className="contact-body">
        {/* Left: info */}
        <div className="contact-info">
          <h3>How can we help?</h3>
          <p>
            Whether you're a house of worship running weekly services, a
            wedding planner coordinating ceremonies, or a production company
            managing large-scale events — we're here to make sure LiveCue
            works perfectly for your team.
          </p>
          <div className="contact-info-items">
            <div className="contact-info-item">
              <div className="contact-info-icon">💼</div>
              <div className="contact-info-text">
                <h4>Sales & Pricing</h4>
                <p>Custom plans for large organizations and venues.</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">🛠️</div>
              <div className="contact-info-text">
                <h4>Support</h4>
                <p>Technical questions, account issues, feature requests.</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">🤝</div>
              <div className="contact-info-text">
                <h4>Partnerships</h4>
                <p>Venue partnerships, reseller inquiries, integrations.</p>
              </div>
            </div>
          </div>
          <div className="contact-use-cases">
            <h4>We work with teams running</h4>
            <div className="contact-use-cases-list">
              {["Houses of Worship", "Weddings", "Corporate Events", "Concerts", "Live Sports", "Theater", "Graduations", "Conferences"].map((u) => (
                <span className="contact-use-tag" key={u}>{u}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="contact-form-card">
          {submitted ? (
            <div className="contact-success">
              <div className="contact-success-icon">✅</div>
              <h3>Message sent!</h3>
              <p>
                Thanks for reaching out. We'll get back to you within 1 business day.
              </p>
            </div>
          ) : (
            <>
              <h3>Send us a message</h3>
              <form onSubmit={handleSubmit}>
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label>First Name</label>
                    <input
                      required
                      name="firstName"
                      placeholder="First name"
                      value={form.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="contact-form-group">
                    <label>Last Name</label>
                    <input
                      required
                      name="lastName"
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="contact-form-group">
                  <label>Email</label>
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="contact-form-group">
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
                <div className="contact-form-group">
                  <label>Subject</label>
                  <input
                    required
                    name="subject"
                    placeholder="What's this about?"
                    value={form.subject}
                    onChange={handleChange}
                  />
                </div>
                <div className="contact-form-group">
                  <label>Message</label>
                  <textarea
                    required
                    name="message"
                    rows={5}
                    placeholder="Tell us about your event and how we can help..."
                    value={form.message}
                    onChange={handleChange}
                  />
                </div>
                <button className="btn-contact-submit" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "#141414", padding: "32px 6%", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontFamily: "Inter-Regular", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          © {new Date().getFullYear()} LiveCue. All rights reserved.
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          <span onClick={() => navigate("/")} style={{ fontFamily: "Inter-Regular", fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Home</span>
          <span onClick={() => navigate("/pricing")} style={{ fontFamily: "Inter-Regular", fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Pricing</span>
        </div>
      </footer>
    </div>
  );
}

export default ContactPage;
