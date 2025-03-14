import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminPage.css";
import logo from '../../Assets/Logo/LIVECUE-Logo.png'
import { Container, Row, Col, Card } from "react-bootstrap";
import { Project } from "../../Interfaces/Project/Project";

interface AdminPageProps {
  projects: Project[];
}

function AdminPage({projects}: AdminPageProps) {
  const navigate = useNavigate();
  const {projectId} = useParams();
  const project = projects.find(p => p.id === Number(projectId));

  let time  = new Date().toLocaleTimeString()
  const [ctime,setTime] = useState(time)
  const UpdateTime=()=>{
    time =  new Date().toLocaleTimeString()
    setTime(time)
  }
  setInterval(UpdateTime)

  return (
    <>
      <header className="app-header-CueInput">
        <h1 className="project-title inter-bold">{project?.title}</h1>
        <img className="heading-CueInput--logo" src={logo} alt="LiveCue" onClick={() => {navigate("/HomePage")}}/>
        <h1 className="project-date inter-bold">
          {project?.date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
        </h1>
      </header>

      <Container
        fluid
        className="AdminPage-body d-flex align-items-center justify-content-center"
      >
        <div>
          <Card className="controlPanel-AdminPage">
            <Card.Body>
              <Row >
                <h1 className="inter-bold" style={{fontSize: '35px'}}>{ctime}</h1>
              </Row>
            </Card.Body>
          </Card>
        </div>
        <div className="scroll-container-AdminPage">
          <div className="scroll-content-AdminPage">
            {project?.cues
              .sort((a, b) => a.cueNumber - b.cueNumber)
              .map((cue) => (
                <Card key={cue.cueNumber} className="AdminPage-Cue">
                  <Card.Body>
                    <Row style={{ marginLeft: 5 }}>
                      <Col xs={3} className="cueNumber">
                        <h5 className="inter-bold" style={{ margin: 0 }}>
                          {cue.cueNumber}
                        </h5>
                      </Col>
                      <Col className="title-AdminPage">
                        <h5
                          className="inter-bold title-AdminPage"
                          style={{ margin: 4, fontSizeAdjust: "0.475" }}
                        >
                          {" "}
                          {cue.title}
                        </h5>
                      </Col>
                    </Row>
                    <hr
                      style={{
                        borderTop: "3px solid #578493",
                        borderRadius: "10px",
                        minWidth: "290px",
                        marginTop: 10,
                        marginBottom: 0,
                        borderStyle: "solid",
                        opacity: "1",
                        marginLeft: -12,
                      }}
                    />

                    <Row>
                      <Col xs={5}>
                        <p
                          className="inter-medium"
                          style={{ margin: 10, marginLeft: 0 }}
                        >
                          Start:{" "}
                          {cue.startTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </Col>
                      <Col
                        xs={2}
                        className="d-flex justify-content-center"
                        style={{ marginLeft: 0 }}
                      >
                        <div className="vertical-line"></div>
                      </Col>
                      <Col xs={1} style={{ paddingLeft: 0 }}>
                        <p
                          className="inter-medium"
                          style={{ margin: 10, marginLeft: -10 }}
                        >
                          End:{" "}
                          {cue.endTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </Col>
                    </Row>
                    <hr
                      style={{
                        borderTop: "3px solid #578493",
                        borderRadius: "10px",
                        minWidth: "290px",
                        marginTop: 0,
                        borderStyle: "solid",
                        opacity: "1",
                        marginLeft: -12,
                      }}
                    />

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          Presenter:{" "}
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.presenter}
                        </p>
                      </Col>
                    </Row>

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          Location:{" "}
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.location}
                        </p>
                      </Col>
                    </Row>

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          AV Media/Audio:{" "}
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.avMedia}
                        </p>
                      </Col>
                    </Row>

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          Audio Source:{" "}
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.audioSource}
                        </p>
                      </Col>
                    </Row>

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          Side Screens:{" "}
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.sideScreens}
                        </p>
                      </Col>
                    </Row>

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          Center Screen:{" "}
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.centerScreen}
                        </p>
                      </Col>
                    </Row>

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          Lighting:{" "}
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.lighting}
                        </p>
                      </Col>
                    </Row>

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          Ambient Lights:
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.ambientLights}
                        </p>
                      </Col>
                    </Row>

                    <Row className="section">
                      <Col xs="auto" className="p-1">
                        <p
                          className="inter-medium"
                          style={{
                            marginLeft: 13,
                            fontSize: "14px",
                            marginBottom: 0,
                          }}
                        >
                          Notes:
                        </p>
                      </Col>
                      <Col className="p-1">
                        <p
                          className="inter-bold text-wrap"
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {cue.notes}
                        </p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            <Row
              className="justify-content-center mt-3 mb-4"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
            </Row>
          </div>
        </div>
      </Container>
    </>
  );
}

export default AdminPage;
