import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminPage.css";
import logo from '../../Assets/Logo/LIVECUE-Logo.png'
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Project } from "../../Interfaces/Project/Project";
import { Cue } from "../../Interfaces/Cue/Cue";
import { db, collection, getDocs, query, where, } from "../../Backend/firebase";
import pause from '../../Assets/Admin-Page/Pause.svg'
import play from '../../Assets/Admin-Page/Play.svg'
import back from '../../Assets/Admin-Page/Back.svg'
import forward from '../../Assets/Admin-Page/Forward.svg'

interface AdminPageProps {
  projects: Project[];
}

function AdminPage({projects}: AdminPageProps) {
  const navigate = useNavigate();
  const {projectId} = useParams();
  const [cues, setCues] = useState<Cue[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCueIndex, setActiveCueIndex] = useState<number>(0); // Tracks current cue

  useEffect(() => {
    if (projectId) {
      fetchCues(projectId);
      const foundProject = projects.find(proj => proj.id === projectId);
      setProject(foundProject || null);
    }
  }, [projectId, projects]);

  const fetchCues = async (projectId: string) => {
    try {
      const q = query(collection(db, "cues"), where("projectRef", "==", projectId));
      const querySnapshot = await getDocs(q);
      const fetchedCues = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cue));
      setCues(fetchedCues);
    } catch (error) {
      console.error("Error fetching cues:", error);
    }
  };

  //Timer
  let time  = new Date().toLocaleTimeString()
  const [ctime,setTime] = useState(time)
  const UpdateTime=()=>{
    time =  new Date().toLocaleTimeString()
    setTime(time)
  }
  setInterval(UpdateTime)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleLive = () => {
    setIsLive(true);
    setIsRunning(true);
  };

  const togglePause = () => {
    setIsRunning(prev => !prev);
  };

  const adjustTime = (seconds: number) => {
    setElapsedTime(prev => Math.max(0, prev + seconds));
  };

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const handleNextCue = () => {
  if (activeCueIndex < cues.length - 1) {
    setActiveCueIndex(prevIndex => prevIndex + 1);
  }
};

// Handles moving to the previous cue
const handlePrevCue = () => {
  if (activeCueIndex > 0) {
    setActiveCueIndex(prevIndex => prevIndex - 1);
  }
};


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
              <Row className="controlPanelSection">
                <Row>
                <h1 className="inter-medium" style={{ fontSize: '35px' }}>{formatTimer(elapsedTime)}</h1>
                </Row>
                <Row style={{padding: '10px'}}>
                  {!isLive ? (
                    <Button onClick={toggleLive} variant="success">Go Live</Button>
                  ) : (
                    <span>
                      <img src = {back} alt='back' style={{maxHeight: '20px'}} onClick={() => adjustTime(-10)} className="mx-2" />
                      {isRunning ? (
                        <img src={pause} alt='pause' style={{maxHeight: '20px', paddingLeft: '10px'}} onClick={togglePause} />
                      ) : (
                        <img src={play} alt='play' style={{maxHeight: '20px', paddingLeft: '10px'}} onClick={togglePause} />
                      )}
                      <img src={forward} alt='forward' style={{maxHeight: '20px', paddingLeft: '10px'}} onClick={() => adjustTime(10)} className="mx-2" />
                    </span>
                  )}
                </Row>
              </Row>
              <Row className="controlPanelSection">
                <Row>
                <h1 className="inter-medium" style={{ fontSize: '35px' }}>Cue Control</h1>
                </Row>
                <Row style={{padding: '10px',}}>
                  <span>
                    <Button onClick={handlePrevCue} disabled={activeCueIndex === 0}>Prev</Button> 
                    <Button onClick={handleNextCue} disabled={activeCueIndex === cues.length - 1}>Next</Button>
                  </span>  
                </Row>
              </Row>
              <Row className="controlPanelSection">
                <Row>
                <p className="inter-medium">Stream URL:</p>
                </Row>
                <Row>
                  <Col xs="auto" className="p-1">
                    <p className="inter-bold text-wrap" style={{ fontSize: "14px", wordBreak: "break-all" }}>
                      {'https://kush-patel1.github.io/LiveCue/#/LiveCueSheet/' + projectId?.toString()}/</p>
                  </Col>
                </Row>
              </Row>
            </Card.Body>
          </Card>
        </div>
        <div className="scroll-container-AdminPage">
          <div className="scroll-content-AdminPage">
            {cues
              .sort((a, b) => a.cueNumber - b.cueNumber)
              .map((cue, index) => (
                <Card key={cue.cueNumber} className={`AdminPage-Cue ${index === activeCueIndex ? "highlighted-cue" : ""}`}>
                  <Card.Body>
                    <Row style={{ marginLeft: 5 }}>
                      <Col xs={3} className={`cueNumber ${index === activeCueIndex ? "highlightedCueNumber" : ""}`}>
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
                    <hr className={`hrAdminPage ${index === activeCueIndex ? "highlightedHrAdminPage" : ""}`}/>

                    <Row>
                      <Col xs={5}>
                      <p className="inter-medium" style={{ margin: 10, marginLeft: 0 }}>
                        Start:{" "}
                        {new Date(cue.startTime).toLocaleTimeString([], {
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
                        <div className={`vertical-line ${index === activeCueIndex ? "highlightedVertical-line" : ""}`}></div>
                      </Col>
                      <Col xs={1} style={{ paddingLeft: 0 }}>
                      <p className="inter-medium" style={{ margin: 10, marginLeft: -10 }}>
                        End:{" "}
                        {new Date(cue.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                      </Col>
                    </Row>
                    
                    <hr style={{marginTop: 0, marginBottom: 10,}} className={`hrAdminPage ${index === activeCueIndex ? "highlightedHrAdminPage" : ""}`}/>

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${index === activeCueIndex ? "highlightedSection" : ""}`}>
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
