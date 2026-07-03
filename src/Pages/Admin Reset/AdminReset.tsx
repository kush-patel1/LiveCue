import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import { getFunctions, httpsCallable } from "firebase/functions";

// Hidden utility page (not linked anywhere). Lets an admin clear leftover
// test-mode Stripe fields from their own account after going live. The backing
// Cloud Function enforces the admin email allowlist.
function AdminReset() {
  usePageTitle("Admin");
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const run = async () => {
    setStatus("working");
    try {
      await httpsCallable(getFunctions(), "adminClearMyBilling")({});
      sessionStorage.removeItem("LIVECUE_PLAN");
      sessionStorage.removeItem("LIVECUE_HAS_SUB");
      setStatus("done");
      setMsg("Billing fields cleared. You can now do a real live purchase to test the portal.");
    } catch (e: any) {
      setStatus("error");
      setMsg(e?.message || "Failed. Are you signed in as an admin?");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#0b1116", color: "#e8eef0", fontFamily: "-apple-system, sans-serif", padding: 24 }}>
      <h1 style={{ fontSize: 20 }}>Reset my billing (admin)</h1>
      <p style={{ color: "#9fb4bc", maxWidth: 420, textAlign: "center", fontSize: 14 }}>
        Clears your account's leftover test-mode Stripe customer so the live Manage Subscription flow works.
      </p>
      <button onClick={run} disabled={status === "working"} style={{ background: "#578493", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 15, cursor: "pointer" }}>
        {status === "working" ? "Working…" : "Clear my billing fields"}
      </button>
      {msg && <p style={{ color: status === "error" ? "#e07a7a" : "#7fbf9a", fontSize: 14, maxWidth: 420, textAlign: "center" }}>{msg}</p>}
      <button onClick={() => navigate("/settings")} style={{ background: "none", border: "none", color: "#7fa8b5", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>Back to Settings</button>
    </div>
  );
}

export default AdminReset;
