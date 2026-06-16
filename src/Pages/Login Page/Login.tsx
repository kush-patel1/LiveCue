import React, { FormEvent, useState } from "react";
import "./Login.css";
import { LoginPageProps } from "./LoginProps";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CredentialLoadingScreen } from "../../Components/LoadingScreen/CredentialLoadingScreen";
import { auth } from "../../Backend/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { applyGrantIfExists } from "../../Services/PlanService/grantCheck";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "../../Interfaces/User/User";
import { getPaymentLink } from "../../Config/stripeLinks";

function mapFirebaseUserToAppUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    firstName: "",
    lastName: "",
    password: "",
  };
}

function Login({ setUser }: LoginPageProps): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    if (!email) { setEmailError("Email is required"); return; }
    if (!password) { setPasswordError("Password is required"); return; }

    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await applyGrantIfExists(credential.user.uid, credential.user.email ?? email);
      const appUser = mapFirebaseUserToAppUser(credential.user);
      sessionStorage.setItem("CURRENT_USER", JSON.stringify(appUser));
      setUser(appUser);
      const paymentUrl = getPaymentLink(searchParams.get("plan"));
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        navigate("/HomePage");
      }
    } catch (error: any) {
      setLoading(false);
      const code = error.code;
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setEmailError("No account found with this email");
      } else if (code === "auth/wrong-password") {
        setPasswordError("Incorrect password");
      } else {
        setEmailError(error.message);
      }
    }
  }

  if (loading) return <CredentialLoadingScreen />;

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo"><span className="auth-logo-live">LIVE</span><span className="auth-logo-cue">CUE</span></div>
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to your account</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className={`auth-input${emailError ? ' auth-input--error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(""); }}
              autoComplete="email"
            />
            {emailError && <span className="auth-error">{emailError}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className={`auth-input${passwordError ? ' auth-input--error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
              autoComplete="current-password"
            />
            {passwordError && <span className="auth-error">{passwordError}</span>}
          </div>

          <button className="auth-submit" type="submit">Sign in</button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to={searchParams.get("plan") ? `/signup?plan=${searchParams.get("plan")}` : "/signup"} className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
