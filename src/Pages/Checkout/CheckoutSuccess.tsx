import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";
import "./CheckoutSuccess.css";

function CheckoutSuccess() {
  usePageTitle("Welcome to Pro");
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); navigate("/HomePage"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="cs-root">
      <div className="cs-bg" aria-hidden="true">
        <div className="cs-orb cs-orb-1" />
        <div className="cs-orb cs-orb-2" />
      </div>

      <div className="cs-card glass-card">
        <img src={logo} alt="LiveCue" className="cs-logo" />

        <div className="cs-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 className="cs-title">You're all set!</h1>
        <p className="cs-body">
          Your subscription is active. Your plan will update within a few seconds
          — you may need to sign out and back in if it doesn't reflect immediately.
        </p>

        <p className="cs-countdown">Redirecting to your dashboard in {countdown}…</p>

        <button className="cs-btn" onClick={() => navigate("/HomePage")}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default CheckoutSuccess;
