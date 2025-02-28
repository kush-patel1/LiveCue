import React, { FormEvent, useEffect, useState } from "react";
import './Login.css';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import { AppHeader } from '../../Components/Header/Header';
import { LoginPageProps } from './LoginProps';
import { Link, useNavigate } from "react-router-dom";
import { User } from "../../Interfaces/User/User";
import { authenticateUser } from "../../Services/UserServices/UserCredentialService";
import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiCallResponse } from "../../Interfaces/Responses/ApiCallResponse";
import { CredentialLoadingScreen } from "../../Components/LoadingScreen/CredentialLoadingScreen";


const correctUsername = "admin";
const correctPassword = "Media#344";

function Login({setUser} : LoginPageProps) : React.JSX.Element {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    //error messages for invaild username or password inputs
    const [usernameMessage, setUsernameMessage] = useState<string>("")
    const [passwordMessage, setPasswordMessage] = useState<string>("")

    const [validated, setValidated] = useState(false);

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    //used to scroll to the top when landing on page
    //easiest solution to workaround being unable to access browser history
    //cursed hash router...
    const [onLanding, setOnLanding] = useState(true);

    useEffect(() => {
        if (onLanding) {
        window.scrollTo(0, 0)
        setOnLanding(false);
        }
    }, [onLanding])

    
    function setErrorMessages() {
        if (username === "") {
            setUsernameMessage("Username is required");
        }

        if (password === "") {
            setPasswordMessage("Password is required")
        }
    }


    function signIn(event : FormEvent<HTMLFormElement>) {
        const form = event.currentTarget;

        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
            setValidated(true)
            setErrorMessages();
            return;
        }
        
        if (username === correctUsername && password === correctPassword) {
            navigate("/HomePage");
            return;
        }
        
        setLoading(true)

        //backend post request to authenticate the user
        authenticateUser(username, password).then((response : AxiosResponse<ApiCallResponse<User>>) => {
                const user = response.data.responseContent;
                if (user !== null) {
                    //sets the retrieved data to the current user in session storage then navigates to home
                    sessionStorage.setItem("CURRENT_USER", JSON.stringify(user));   
                    setUser(user); 
                    setLoading(false)
                    navigate("/HomePage"); 
                }
        //for whatever reason that it might fail...
        }).catch((e : AxiosError<ApiCallResponse<User>>) => {
            if (axios.isAxiosError(e) && e.response && e.response.data) {
                console.log(e)
                setLoading(false)
                //placeholder until I can deduce proper embeded type...
                //Proper typing has been deduced :)
                const message = e.response.data;

                //checks the error sent from backend and parses the contents.
                if (message !== undefined){
                    if (message.detailedMessage.toLowerCase().includes("username")) {
                        setUsernameMessage(message.detailedMessage);
                        setPasswordMessage("");
                    } 
                    if (message.detailedMessage.toLowerCase().includes("password")) {
                        setPasswordMessage(message.detailedMessage);
                        setUsernameMessage("");
                    }
                }


            }
        })
    }


    if (loading) {
        return <CredentialLoadingScreen></CredentialLoadingScreen>
    }


    return (
        <><div>
            {AppHeader()}
        </div><Container fluid className="Login-body d-flex align-items-center justify-content-center">
                <Row className="w-100 justify-content-center">
                    <Col xxs={15} xs={16} sm={8} md={6} lg={6} xl={5} xxl = {4}>
                        <Card className="Login-popup">
                            <Card.Body>
                                <h2 className="text-center mb-4">Login</h2>
                                <Form noValidate validated = {validated} onSubmit={signIn}>
                                    <Form.Group controlId="formUsername" className="mb-3">
                                        <Form.Label>Username</Form.Label>
                                        <Form.Control
                                            required
                                            placeholder="admin" 
                                            value = {username}
                                            size = "lg"
                                            onChange={(e) => {
                                                setUsername(e.target.value);
                                                console.log(e)
                                            }}
                                            isInvalid = {usernameMessage!==""}
                                            >
                                            </Form.Control>
                                            <Form.Control.Feedback type = "invalid">
                                                {usernameMessage}
                                            </Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Label>Password</Form.Label>
                                    <Form.Group>
                                            <Form.Control
                                            required
                                            className = "form--font" 
                                            placeholder="Media#344" 
                                            value = {password}
                                            size = "lg"
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                console.log(e)
                                            }}
                                            isInvalid = {passwordMessage!==""}
                                            >
                                            </Form.Control>
                                            <Form.Control.Feedback type = "invalid">
                                                {passwordMessage}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    <div style={{paddingTop: '5%', paddingBottom:'2%'}}>
                                        <Button className="Submit-Button" type="submit">
                                            Submit
                                        </Button>
                                    </div>
                                </Form>
                                <span> Don't have an account? Sign up&nbsp;
                                    <Link to = "/SignUp" relative="path">here</Link> </span>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container></>
    );
}

export default Login;
