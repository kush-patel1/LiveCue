import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { FormEvent, useEffect, useState } from "react";
import { User } from "../../Interfaces/User/User";
import { Link, useNavigate } from "react-router-dom";
import { SignUpPageProps } from "./SignUpProps";
import { createUser } from "../../Services/UserServices/UserCredentialService";
import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiCallResponse } from "../../Interfaces/Responses/ApiCallResponse";
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


  function createUserObject(): User {
    const newAccount: User = {
      id: -1,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
    };
    return newAccount;
  }

  function createAccount(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    //checks if the form and input fields are actually valid or not
    if (!form.checkValidity()) {
      setEmailMessage("Invalid email");

      event.preventDefault();
      event.stopPropagation();
      setValidated(true);
      return;
    } else {
      const newAccount = createUserObject();
      setLoading(true);

      //sends request to the backend to create new user account
      createUser(newAccount)
        .then((response: AxiosResponse<ApiCallResponse<User>>) => {
          setLoading(false);
          const responseData = response.data;

          //parses the data into a string and saves it to the session storage
          const accountJSONString = JSON.stringify(
            responseData.responseContent,
            null,
            4,
          );
          sessionStorage.setItem("CURRENT_USER", accountJSONString);
          setUser(responseData.responseContent);
          navigate("/HomePage");
          //for whatever reason it may fail
        })
        .catch((e: AxiosError<ApiCallResponse<User>>) => {
          setLoading(false);
          if (axios.isAxiosError(e) && e.response && e.response.data) {
            const errorResponse = e.response?.data;

            //really there is only one backend error and that is the email is already in use.
            //future will have email validation here to check if email exists.
            //Also profanity check might be good just in case any hooligans decide to be funny...
            if (errorResponse.detailedMessage.includes("email")) {
              setEmailMessage(errorResponse.detailedMessage);
            }
          }
        });
    }
  }

  if (loading) {
    return <CredentialLoadingScreen></CredentialLoadingScreen>;
  }

  return (
    <>
      <div>{AppHeader()}</div>
      <Container
        fluid
        className="SignUp-body d-flex align-items-center justify-content-center"
      >
        <Row className="w-100 justify-content-center">
          <Col xxs={12} xs={11} sm={9} md={7} lg={4}>
            <Card className="SignUp-popup">
              <Card.Body>
                <h2 className="text-center mb-4">Sign Up</h2>
                <Form noValidate validated={validated} onSubmit={createAccount}>
                  <Form.Label>First Name:</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="First Name"
                      size="lg"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        console.log(firstName);
                      }}
                    ></Form.Control>
                    <Form.Control.Feedback type="invalid">
                      First Name Required
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Label className="Form-Labels">Last Name:</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="Last Name"
                      size="lg"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        console.log(lastName);
                      }}
                    ></Form.Control>
                    <Form.Control.Feedback type="invalid">
                      Last Name Required
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Label className="Form-Labels">Email:</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="email"
                      value={email}
                      size="lg"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        console.log(e);
                      }}
                      isInvalid={emailMessage !== ""}
                    ></Form.Control>
                    <Form.Control.Feedback type="invalid">
                      {emailMessage}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Label className="Form-Labels">Password:</Form.Label>
                  <Form.Group>
                    <Form.Control
                      required
                      className="form--font"
                      placeholder="password123"
                      value={password}
                      size="lg"
                      onChange={(e) => {
                        setPassword(e.target.value);
                        console.log(e);
                      }}
                      pattern=".{7,}"
                    ></Form.Control>
                    <Form.Control.Feedback type="invalid">
                      Invalid Password
                    </Form.Control.Feedback>
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
                    </Link>{" "}
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
