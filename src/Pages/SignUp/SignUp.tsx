import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { FormEvent, useEffect, useState } from "react";
import { User } from "../../Interfaces/User/User";
import { Link, useNavigate } from "react-router-dom";
import { SignUpPageProps } from "./SignUpProps";
import { auth, db, createUserWithEmailAndPassword, setDoc, doc } from "../../Backend/firebase";  // Import Firebase functions
import { CredentialLoadingScreen } from "../../Components/LoadingScreen/CredentialLoadingScreen";
import { AppHeader } from "../../Components/Header/Header";
import "./SignUp.css";

export function SignUp({ setUser }: SignUpPageProps): React.JSX.Element {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [validated, setValidated] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [emailMessage, setEmailMessage] = useState<string>("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [onLanding, setOnLanding] = useState(true);

  useEffect(() => {
    if (onLanding) {
      window.scrollTo(0, 0);
      setOnLanding(false);
    }
  }, [onLanding]);

  // Create the user object for Firestore
  function createUserObject(): User {
    const newAccount: User = {
      id: '',
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
    };
    return newAccount;
  }

  // Handle Firebase sign-up and store user in Firestore
  async function createAccount(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setEmailMessage("Invalid email");
      event.preventDefault();
      event.stopPropagation();
      setValidated(true);
      return;
    } else {
      const newAccount = createUserObject();
      setLoading(true);

      try {
        // Firebase Authentication - Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create the user object in Firestore
        const userRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userRef, {
          firstName: newAccount.firstName,
          lastName: newAccount.lastName,
          email: newAccount.email,
          password: newAccount.password,
        });

        // If successful, save user data and navigate
        const userData = { ...newAccount, id: userCredential.user.uid };
        setUser(userData);
        sessionStorage.setItem("CURRENT_USER", JSON.stringify(userData, null, 4));
        navigate("/HomePage");

      } catch (error) {
        setLoading(false);
        if (error instanceof Error) {
          setEmailMessage(error.message);
        }
      }
    }
  }

  if (loading) {
    return <CredentialLoadingScreen />;
  }

  return (
    <>
      <AppHeader />
      <Container fluid className="SignUp-body d-flex align-items-center justify-content-center">
        <Row className="w-100 justify-content-center">
          <Col xxs={12} xs={11} sm={9} md={7} lg={4}>
            <Card className="SignUp-popup">
              <Card.Body>
                <h2 className="text-center mb-4">Sign Up</h2>
                <Form noValidate validated={validated} onSubmit={createAccount}>
                  {/* Form fields remain the same */}
                  <Form.Label>First Name:</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="First Name"
                      size="lg"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">First Name Required</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Label className="Form-Labels">Last Name:</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="Last Name"
                      size="lg"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">Last Name Required</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Label className="Form-Labels">Email:</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="email"
                      value={email}
                      size="lg"
                      onChange={(e) => setEmail(e.target.value)}
                      isInvalid={emailMessage !== ""}
                    />
                    <Form.Control.Feedback type="invalid">{emailMessage}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Label className="Form-Labels">Password:</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="password123"
                      value={password}
                      size="lg"
                      onChange={(e) => setPassword(e.target.value)}
                      pattern=".{7,}"
                    />
                    <Form.Control.Feedback type="invalid">Invalid Password</Form.Control.Feedback>
                  </Form.Group>

                  <div style={{ paddingTop: "5%", paddingBottom: "2%" }}>
                    <Button className="Submit-Button" type="submit">
                      Create Account
                    </Button>
                  </div>
                  <span>
                    Already have an account? Login&nbsp;
                    <Link to="/" relative="path">
                      here
                    </Link>
                  </span>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default SignUp;
