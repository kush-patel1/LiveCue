import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { AppHeader } from "../../Components/Header/Header";
import {
  Container,
  Row,
  Col,
  Card,
  Modal,
  Form,
  Button,
} from "react-bootstrap";
import addMoreButton from "../../Assets/Home-Page/Add-More-Button.png";
import editButton from "../../Assets/Home-Page/Edit-Button.png";
import liveButton from "../../Assets/Home-Page/Live-Button.png";
import { Project } from "../../Interfaces/Project/Project";

function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDate, setNewProjectDate] = useState("");
  const [newProjectStartTime, setNewProjectStartTime] = useState("");
  const [newProjectEndTime, setNewProjectEndTime] = useState("");
  const [newProjectID, setNewProjectID] = useState(1);
  const [newProjectCueAmount, setNewProjectCueAmount] = useState(1);

  const handleAddProject = () => {
    if (
      !newProjectTitle ||
      !newProjectDate ||
      !newProjectStartTime ||
      !newProjectEndTime
    ) {
      alert("Please enter all fields!");
      return;
    }

    const startTime = new Date(`${newProjectDate}T${newProjectStartTime}:00`);
    const endTime = new Date(`${newProjectDate}T${newProjectEndTime}:00`);

    if (startTime >= endTime) {
      alert("End time must be after start time!");
      return;
    }

    const durationMinutes = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 60000,
    );

    const newProject: Project = {
      id: newProjectID,
      title: newProjectTitle,
      date: new Date(newProjectDate),
      startTime,
      endTime,
      duration: new Date(
        0,
        0,
        0,
        Math.floor(durationMinutes / 60),
        durationMinutes % 60,
      ), // Store duration in minutes
      cues: [],
      cueAmount: newProjectCueAmount,
    };

    setProjects([...projects, newProject]);
    setNewProjectID(newProjectID + 1);
    setShowModal(false);
    setNewProjectTitle("");
    setNewProjectDate("");
    setNewProjectStartTime("");
    setNewProjectEndTime("");
    setNewProjectCueAmount(1); // Reset cue amount to initial state
  };

  return (
    <>
      <AppHeader />
      <Container
        fluid
        className="HomePage-body d-flex align-items-center justify-content-center"
      >
        <Row
          className="justify-content-center text-center mt-3 mb-4"
          style={{ padding: "2%" }}
        >
          <Col>
            <img
              src={addMoreButton}
              height={"60%"}
              alt="Add More"
              style={{ cursor: "pointer" }}
              onClick={() => setShowModal(true)}
            />
          </Col>
        </Row>
        <div className="scroll-container">
          <div className="scroll-content">
            {projects
              .sort((a, b) => b.id - a.id)
              .map((project) => (
                <Card key={project.id} className="HomePage-Project1">
                  <Card.Body>
                    <h1 className="inter-bold title-HomePage">
                      {project.title}
                    </h1>
                    <h3
                      className="inter-semibold"
                      style={{ paddingBottom: "5%" }}
                    >
                      {project.date.toLocaleDateString([], {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                    <h3 className="inter-semibold">Details</h3>
                    <p className="inter-medium" style={{ marginBottom: "1%" }}>
                      Start Time:{" "}
                      {project.startTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    <p className="inter-medium" style={{ marginBottom: "1%" }}>
                      End Time:{" "}
                      {project.endTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    <p
                      className="inter-medium"
                      style={{ paddingBottom: "5%", marginBottom: "1%" }}
                    >
                      Duration:{" "}
                      {`${project.duration.getHours()}hr ${project.duration.getMinutes()}min`}
                    </p>
                    <h3 className="inter-semibold">
                      Cues: {project.cueAmount}
                    </h3>
                    {project.cues.length > 0 ? (
                      project.cues.slice(0, 5).map((cue, index) => (
                        <p
                          key={index}
                          className="inter-medium"
                          style={{ marginBottom: "1%" }}
                        >
                          0{index + 1}: {cue.title}
                        </p>
                      ))
                    ) : (
                      <p
                        className="inter-medium"
                        style={{ marginBottom: "1%" }}
                      >
                        No cues added yet
                      </p>
                    )}
                    <div className="d-flex justify-content-between">
                      <img
                        src={editButton}
                        height="40px"
                        alt="Edit"
                        onClick={() => navigate(`/CueInput/${project.id}`)} // Pass project ID in URL
                        style={{ paddingLeft: "15%", cursor: "pointer" }}
                      />
                      <img
                        src={liveButton}
                        height="40px"
                        alt="Live"
                        onClick={() => navigate("/LiveCueSheet")}
                        style={{ paddingRight: "20%" }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              ))}
          </div>
        </div>
      </Container>
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        className="modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter project title"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                style={{
                  backgroundColor: "#141414",
                  borderColor: "$141414",
                  color: "#fff6ee",
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Date</Form.Label>
              <Form.Control
                type="date"
                value={newProjectDate}
                onChange={(e) => setNewProjectDate(e.target.value)}
                style={{
                  backgroundColor: "#141414",
                  borderColor: "$141414",
                  color: "#fff6ee",
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Start Time</Form.Label>
              <Form.Control
                type="time"
                value={newProjectStartTime}
                onChange={(e) => setNewProjectStartTime(e.target.value)}
                style={{
                  backgroundColor: "#141414",
                  borderColor: "$141414",
                  color: "#fff6ee",
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project End Time</Form.Label>
              <Form.Control
                type="time"
                value={newProjectEndTime}
                onChange={(e) => setNewProjectEndTime(e.target.value)}
                style={{
                  backgroundColor: "#141414",
                  borderColor: "$141414",
                  color: "#fff6ee",
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Cue Amount</Form.Label>
              <Form.Control
                type="number"
                value={newProjectCueAmount}
                onChange={(e) =>
                  setNewProjectCueAmount(parseInt(e.target.value, 10))
                }
                style={{
                  backgroundColor: "#141414",
                  borderColor: "$141414",
                  color: "#fff6ee",
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddProject}>
            Add Project
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default HomePage;
