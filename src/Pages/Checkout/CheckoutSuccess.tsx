import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";
import "./CheckoutSuccess.css";
import { auth, db, doc } from "../../Backend/firebase";
import { getDoc } from "firebase/firestore";

type Status = "activating" | "active" | "slow";

const POLL_MS = 2000;
const SLOW_AFTER_MS = 20000; // show "taking longer than usual" after 20s

function CheckoutSuccess() {
  usePageTitle("Checkout Complete");
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("activating");
  const [planName, setPlanName] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  // Poll the user doc until the Stripe webhook writes the paid plan.
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        const data = snap.data() ?? {};
        const plan = data.planOverride ?? data.plan ?? "free";
        if (!cancelled && plan !== "free") {
          // Refresh the cached plan so the rest of the app picks it up
          sessionStorage.setItem("LIVECUE_PLAN", plan);
          sessionStorage.setItem("LIVECUE_HAS_SUB", data.stripeSubscriptionId ? "1" : "0");
          setPlanName(plan);
          setStatus("active");
        }
      } catch { /* transient read error — keep polling */ }
    };

    check();
    const id = setInterval(() => {
      if (Date.now() - startedAt.current > SLOW_AFTER_MS) {
        setStatus((s) => (s === "activating" ? "slow" : s));
      }
      check();
    }, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Once active, auto-redirect after a short beat
  useEffect(() => {
    if (status !== "active") return;
    const id = setTimeout(() => navigate("/HomePage"), 4000);
    return () => clearTimeout(id);
  }, [status, navigate]);

  return (
    <div className="cs-root">
      <div className="cs-bg" aria-hidden="true">
        <div className="cs-orb cs-orb-1" />
        <div className="cs-orb cs-orb-2" />
      </div>

      <div className="cs-card glass-card">
        <img src={logo} alt="LiveCue" className="cs-logo" />

        {status === "active" ? (
          <>
            <div className="cs-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="cs-title">
              Welcome to {planName === "team" ? "Team" : "Pro"}!
            </h1>
            <p className="cs-body">
              Your subscription is confirmed and your account has been upgraded.
              Taking you to your dashboard…
            </p>
            <button className="cs-btn" onClick={() => navigate("/HomePage")}>
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <div className="cs-icon cs-icon--spin">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.2-8.56"/>
              </svg>
            </div>
            <h1 className="cs-title">Activating your plan…</h1>
            <p className="cs-body">
              {status === "slow"
                ? "This is taking a little longer than usual. Your payment went through — the upgrade can take a minute to land. You can head to your dashboard; the plan will apply automatically."
                : "Payment received. We're switching on your subscription — this usually takes a few seconds."}
            </p>
            {status === "slow" && (
              <button className="cs-btn" onClick={() => navigate("/HomePage")}>
                Go to Dashboard
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CheckoutSuccess;
