import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { Button, Form, Alert } from 'react-bootstrap';

const correctUsername = "admin";
const correctPassword = "Media#344";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (username === correctUsername && password === correctPassword) {
            setError(""); // Clear error on success
            navigate("/HomePage");
        } else {
            setError("Invalid username or password.");
        }
    };

    return (
        <div>
            <Form onSubmit={handleSubmit}>
                <Form.Label>Login:</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Insert Username Here"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <Form.Control
                    type="password"
                    placeholder="Insert Password Here"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <br />
                {error && <Alert variant="danger">{error}</Alert>}
                <Button className="Submit-Button" type="submit">
                    Submit
                </Button>
            </Form>
        </div>
    );
}

export default Login;