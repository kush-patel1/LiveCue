import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminPage.css";
import logo from '../../Assets/Logo/LIVECUE-Logo.png'
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Project } from "../../Interfaces/Project/Project";
import { Cue } from "../../Interfaces/Cue/Cue";
import { db, collection, getDocs, query, where, updateDoc, doc, onSnapshot } from "../../Backend/firebase";
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

useEffect(() => {
  if (!projectId) return;

  const q = query(collection(db, "cues"), where("projectRef", "==", projectId));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const updatedCues = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Cue[];
    setCues(updatedCues);
  });

  return () => unsubscribe(); // Cleanup listener on unmount
}, [projectId]);

const handleNextCue = async () => {
  const liveCueIndex = cues.findIndex(cue => cue.isLive); // Find the currently live cue
  if (liveCueIndex === -1 || liveCueIndex >= cues.length - 1) return; // No live cue or last cue

  const currentCue = cues[liveCueIndex];
  const nextCue = cues[liveCueIndex + 1];

  try {
    // Update Firebase
    await updateDoc(doc(db, "cues", currentCue.id), { isLive: false });
    await updateDoc(doc(db, "cues", nextCue.id), { isLive: true });
  } catch (error) {
    console.error("Error updating cues:", error);
  }
};

const handlePrevCue = async () => {
  const liveCueIndex = cues.findIndex(cue => cue.isLive);
  if (liveCueIndex <= 0) return; // No previous cue or first cue

  const currentCue = cues[liveCueIndex];
  const prevCue = cues[liveCueIndex - 1];

  try {
    // Update Firebase
    await updateDoc(doc(db, "cues", currentCue.id), { isLive: false });
    await updateDoc(doc(db, "cues", prevCue.id), { isLive: true });
  } catch (error) {
    console.error("Error updating cues:", error);
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
        <Card className="controlPanel-AdminPage text-center">
          <Card.Body>
            <Row className="justify-content-center" style={{marginTop: '10%'}}>
              <h1 className="inter-bold" style={{ fontSize: '40px' }}>{ctime}</h1>
            </Row>
            <Row className="controlPanelSection justify-content-center" style={{marginTop: '7%'}}>
              <h1 className="inter-medium" style={{ fontSize: '35px' }}>{formatTimer(elapsedTime)}</h1>
              <Row className="justify-content-center" style={{ padding: '10px' }}>
                {!isLive ? (
                  <Button onClick={toggleLive} variant="success">Go Live</Button>
                ) : (
                  <span className="d-flex justify-content-center align-items-center gap-3">
                    <img src={back} alt="back" style={{ maxHeight: '20px' }} onClick={() => adjustTime(-10)} />
                    {isRunning ? (
                      <img src={pause} alt="pause" style={{ maxHeight: '20px' }} onClick={togglePause} />
                    ) : (
                      <img src={play} alt="play" style={{ maxHeight: '20px' }} onClick={togglePause} />
                    )}
                    <img src={forward} alt="forward" style={{ maxHeight: '20px' }} onClick={() => adjustTime(10)} />
                  </span>
                )}
              </Row>
            </Row>
            <Row className="controlPanelSection justify-content-center" style={{marginTop: '7%'}}>
              <h1 className="inter-semibold">Cue Control</h1>
              <Row className="justify-content-center" style={{ padding: '10px' }}>
                <span>
                <button onClick={handlePrevCue} disabled={cues.findIndex(cue => cue.isLive) <= 0} className="PrevNext-Buttons inter-medium">Prev</button>
                <button onClick={handleNextCue} disabled={cues.findIndex(cue => cue.isLive) >= cues.length - 1} className="PrevNext-Buttons inter-medium">Next</button>
                </span>
              </Row>
            </Row>
            <Row className="controlPanelSection" style={{marginTop: '7%'}}>
              <p className="inter-medium" style={{alignSelf: 'left'}}>Stream URL:</p>
              <Row className="justify-content-center">
                <Col xs="auto" className="p-1">
                  <p className="inter-bold text-wrap" style={{ fontSize: "14px", wordBreak: "break-all" }}>
                    {'https://kush-patel1.github.io/LiveCue/#/LiveCueSheet/' + projectId?.toString()}/
                  </p>
                </Col>
              </Row>
            </Row>
          </Card.Body>
        </Card>
        <div className="scroll-container-AdminPage">
          <div className="scroll-content-AdminPage">
            {cues
              .sort((a, b) => a.cueNumber - b.cueNumber)
              .map((cue) => (
                <Card key={cue.cueNumber} className={`AdminPage-Cue ${cue.isLive ? "highlighted-cue" : ""}`}>
                  <Card.Body>
                    <Row style={{ marginLeft: 5 }}>
                      <Col xs={3} className={`cueNumber ${cue.isLive ? "highlightedCueNumber" : ""}`}>
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
                    <hr className={`hrAdminPage ${cue.isLive ? "highlightedHrAdminPage" : ""}`}/>

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
                        <div className={`vertical-line ${cue.isLive ? "highlightedVertical-line" : ""}`}></div>
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
                    
                    <hr style={{marginTop: 0, marginBottom: 10,}} className={`hrAdminPage ${cue.isLive ? "highlightedHrAdminPage" : ""}`}/>

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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

                    <Row className={`section ${cue.isLive ? "highlightedSection" : ""}`}>
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
