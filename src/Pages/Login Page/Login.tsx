import React, { FormEvent, useEffect, useState } from "react";
import "./Login.css";
import { Button, Form, Container, Row, Col, Card } from "react-bootstrap";
import { AppHeader } from "../../Components/Header/Header";
import { LoginPageProps } from "./LoginProps";
import { Link, useNavigate } from "react-router-dom";
import { CredentialLoadingScreen } from "../../Components/LoadingScreen/CredentialLoadingScreen";
import { auth } from "../../Backend/firebase"; // Importing auth from firebase.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "../../Interfaces/User/User";

function Login({ setUser }: LoginPageProps): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailMessage, setEmailMessage] = useState<string>("");
  const [passwordMessage, setPasswordMessage] = useState<string>("");

  const [validated, setValidated] = useState(false);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [onLanding, setOnLanding] = useState(true);

  useEffect(() => {
    if (onLanding) {
      window.scrollTo(0, 0);
      setOnLanding(false);
    }
  }, [onLanding]);

  function setErrorMessages() {
    if (email === "") {
      setEmailMessage("Email is required");
    }

    if (password === "") {
      setPasswordMessage("Password is required");
    }
  }

  function mapFirebaseUserToAppUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      firstName: "",  // You can fetch this data from Firestore or leave it empty for now
      lastName: "",   // Same as above
      password: "",   // Firebase doesn't return the password, so you'll handle it elsewhere
    };
  }
  

  // Firebase SignIn function using auth from firebase.js
  function signInWithFirebase() {
    setLoading(true);

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in successfully
        const firebaseUser = userCredential.user;
        const appUser = mapFirebaseUserToAppUser(firebaseUser);
          // Save user session
          sessionStorage.setItem("CURRENT_USER", JSON.stringify(appUser));
          setUser(appUser);
          setLoading(false);
          navigate("/HomePage");
      })
      .catch((error) => {
        // Handle errors
        setLoading(false);
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === "auth/user-not-found") {
          setEmailMessage("Email not found");
        } else if (errorCode === "auth/wrong-password") {
          setPasswordMessage("Incorrect password");
        } else {
          setEmailMessage(errorMessage);
        }
      });
  }

  function signIn(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      setValidated(true);
      setErrorMessages();
      return;
    }

    signInWithFirebase(); // Use Firebase sign-in
  }

  if (loading) {
    return <CredentialLoadingScreen />;
  }

  return (
    <>
      <AppHeader/>
      <Container
        fluid
        className="Login-body d-flex align-items-center justify-content-center"
      >
        <Row className="w-100 justify-content-center">
          <Col xxs={15} xs={16} sm={8} md={6} lg={6} xl={5} xxl={4}>
            <Card className="Login-popup">
              <Card.Body>
                <h2 className="text-center mb-4">Login</h2>
                <Form noValidate validated={validated} onSubmit={signIn}>
                  <Form.Group controlId="formEmail" className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      required
                      placeholder="admin"
                      value={email}
                      size="lg"
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      isInvalid={emailMessage !== ""}
                    ></Form.Control>
                    <Form.Control.Feedback type="invalid">
                      {emailMessage}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Label>Password</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="Media#344"
                      value={password}
                      size="lg"
                      onChange={(e) => {
                        setPassword(e.target.value);
                      }}
                      isInvalid={passwordMessage !== ""}
                    ></Form.Control>
                    <Form.Control.Feedback type="invalid">
                      {passwordMessage}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <div style={{ paddingTop: "5%", paddingBottom: "2%" }}>
                    <Button className="Submit-Button" type="submit">
                      Submit
                    </Button>
                  </div>
                </Form>
                <span>
                  Don't have an account? Sign up&nbsp;
                  <Link to="/SignUp" relative="path">
                    here
                  </Link>
                </span>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Login;
