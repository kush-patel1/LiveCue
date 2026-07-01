import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import logo from "../../Assets/Logo/LIVECUE-Logo.png";
import { auth } from "../../Backend/firebase";
import { acceptTeamInvite } from "../../Services/TeamService/teamService";
import "./AcceptInvite.css";

type State = "loading" | "success" | "error" | "no-invite";

function AcceptInvite() {
  usePageTitle("Team Invite");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamId = searchParams.get("teamId") ?? "";

  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!teamId) {
      setState("error");
      setErrorMsg("This invite link is missing required information. Ask your team owner to resend the invite.");
      return;
    }

    // Wait for Firebase Auth to settle before calling the function
    const unsub = auth.onAuthStateChanged(async (user) => {
      unsub();

      if (!user) {
        // Not authenticated — send to login, preserving the invite URL
        const returnPath = `/accept-invite?teamId=${teamId}`;
        navigate(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }

      try {
        await acceptTeamInvite(teamId);
        // Clear the cached plan so usePlan picks up the new teamId
        sessionStorage.removeItem("LIVECUE_PLAN");
        sessionStorage.removeItem("LIVECUE_TEAM");
        setState("success");
      } catch (e: any) {
        const code: string = e?.code ?? "";
        if (code === "functions/already-exists") {
          setState("success"); // already a member — treat as success
        } else if (code === "functions/permission-denied") {
          setState("no-invite");
          setErrorMsg("No pending invite was found for your email address. The invite may have been revoked.");
        } else if (code === "functions/resource-exhausted") {
          setState("error");
          setErrorMsg("This team is full. Ask your team owner to free up a seat before you can join.");
        } else {
          setState("error");
          setErrorMsg(e?.message || "Something went wrong. Please try again or contact your team owner.");
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Countdown redirect after success
  useEffect(() => {
    if (state !== "success") return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); navigate("/HomePage"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state, navigate]);

  return (
    <div className="ai-root">
      <div className="ai-bg" aria-hidden="true">
        <div className="ai-orb ai-orb-1" />
        <div className="ai-orb ai-orb-2" />
      </div>

      <div className="ai-card glass-card">
        <img src={logo} alt="LiveCue" className="ai-logo" />

        {state === "loading" && (
          <>
            <div className="ai-spinner" />
            <h1 className="ai-title">Joining your team…</h1>
            <p className="ai-body">Just a moment while we set up your access.</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="ai-icon ai-icon--success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="ai-title">You're on the team!</h1>
            <p className="ai-body">
              You now have full team access. Head to your dashboard to get started.
            </p>
            <p className="ai-countdown">Redirecting in {countdown}…</p>
            <button className="ai-btn" onClick={() => navigate("/HomePage")}>
              Go to Dashboard
            </button>
          </>
        )}

        {state === "no-invite" && (
          <>
            <div className="ai-icon ai-icon--warn">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="ai-title">Invite not found</h1>
            <p className="ai-body">{errorMsg}</p>
            <button className="ai-btn ai-btn--secondary" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <div className="ai-icon ai-icon--error">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="ai-title">Something went wrong</h1>
            <p className="ai-body">{errorMsg}</p>
            <button className="ai-btn ai-btn--secondary" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AcceptInvite;
