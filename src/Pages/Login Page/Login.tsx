import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { Button, Form, Alert, Container, Row, Col, Card } from 'react-bootstrap';

const correctUsername = "admin";
const correctPassword = "Media#344";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === correctUsername && password === correctPassword) {
            setError(""); // Clear error on success
            navigate("/HomePage");
        } else {
            setError("Invalid username or password.");
        }
    };

    return (
        <Container fluid className="Login-body d-flex align-items-center justify-content-center">
            <Row className="w-100 justify-content-center">
                <Col xs={10} sm={8} md={6} lg={4}>
                    <Card className="Login-popup">
                        <Card.Body>
                            <h1 className="text-center mb-4">LiveCue</h1>
                            <h2 className="text-center mb-4">Login</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group controlId="formUsername" className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group controlId="formPassword" className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <div className="d-grid">
                                    <Button className="Submit-Button" type="submit">
                                        Submit
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;
