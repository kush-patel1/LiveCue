import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../Backend/firebase";
import { CredentialLoadingScreen } from "../../Components/LoadingScreen/CredentialLoadingScreen";

// This account must exist in Firebase Auth with the demo project pre-loaded in Firestore.
// Create it once in the Firebase console: demo@livecue.app / DemoLiveCue2024!
const DEMO_EMAIL = process.env.REACT_APP_DEMO_EMAIL || "";
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD || "";

function DemoPage() {
  usePageTitle("Demo");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) {
      setError("Demo account is not configured.");
      return;
    }

    signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD)
      .then((cred) => {
        const demoUser = {
          id: cred.user.uid,
          email: cred.user.email || "",
          firstName: "Demo",
          lastName: "User",
          password: "",
          isDemo: true,
        };
        sessionStorage.setItem("CURRENT_USER", JSON.stringify(demoUser));
        sessionStorage.setItem("IS_DEMO", "true");
        navigate("/HomePage");
      })
      .catch(() => {
        setError("Demo account unavailable. Please try again later.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff6ee", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontFamily: "Inter-Regular", fontSize: 16, color: "#6b7280" }}>{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{ fontFamily: "Inter-SemiBold", fontSize: 14, background: "#578493", color: "white", border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer" }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return <CredentialLoadingScreen />;
}

export default DemoPage;
