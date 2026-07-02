import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import { auth } from "../../Backend/firebase";

function NotFound() {
  usePageTitle("Page not found");
  const navigate = useNavigate();
  const home = auth.currentUser ? "/HomePage" : "/";
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#0b1116", color: "#e8eef0", fontFamily: "-apple-system, sans-serif", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 15, letterSpacing: "0.14em", color: "#7fa8b5" }}>LIVECUE</div>
      <h1 style={{ fontSize: 64, margin: 0, fontWeight: 800 }}>404</h1>
      <p style={{ color: "#9fb4bc", maxWidth: 380, fontSize: 15, lineHeight: 1.6 }}>
        We couldn't find that page. The link may be broken or the page may have moved.
      </p>
      <button
        onClick={() => navigate(home)}
        style={{ background: "linear-gradient(135deg, #578493, #3d7080)", color: "#fff", border: "none", borderRadius: 999, padding: "11px 26px", fontSize: 15, cursor: "pointer" }}
      >
        {auth.currentUser ? "Back to dashboard" : "Back to home"}
      </button>
    </div>
  );
}

export default NotFound;
