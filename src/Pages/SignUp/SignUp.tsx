import { FormEvent, useState } from "react";
import { User } from "../../Interfaces/User/User";
import { Link, useNavigate } from "react-router-dom";
import { SignUpPageProps } from "./SignUpProps";
import { auth, db, createUserWithEmailAndPassword, setDoc, doc } from "../../Backend/firebase";
import { applyGrantIfExists } from "../../Services/PlanService/grantCheck";
import { CredentialLoadingScreen } from "../../Components/LoadingScreen/CredentialLoadingScreen";
import "../Login Page/Login.css";
import "./SignUp.css";

export function SignUp({ setUser }: SignUpPageProps): React.JSX.Element {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    if (password.length < 7) {
      setPasswordError("Password must be at least 7 characters");
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", credential.user.uid);
      await setDoc(userRef, { firstName, lastName, email, password, plan: "free" });
      await applyGrantIfExists(credential.user.uid, email);

      const userData: User = { id: credential.user.uid, firstName, lastName, email, password };
      setUser(userData);
      sessionStorage.setItem("CURRENT_USER", JSON.stringify(userData));
      navigate("/HomePage");
    } catch (error: any) {
      setLoading(false);
      if (error.code === "auth/email-already-in-use") {
        setEmailError("An account with this email already exists");
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
        <h1 className="auth-heading">Create account</h1>
        <p className="auth-sub">Get started for free</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field-row">
            <div className="auth-field">
              <label className="auth-label">First name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="First"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Last name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Last"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className={`auth-input${emailError ? ' auth-input--error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(""); }}
              required
              autoComplete="email"
            />
            {emailError && <span className="auth-error">{emailError}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className={`auth-input${passwordError ? ' auth-input--error' : ''}`}
              type="password"
              placeholder="Min. 7 characters"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
              required
              autoComplete="new-password"
            />
            {passwordError && <span className="auth-error">{passwordError}</span>}
          </div>

          <button className="auth-submit" type="submit">Create account</button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
