import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./LiveCueSheet.css";
import logo from '../../Assets/Logo/LIVECUE-Logo.png'
import { Row, Col, Card, Container } from "react-bootstrap";
import { Project } from "../../Interfaces/Project/Project";
import { Cue } from "../../Interfaces/Cue/Cue";
import { db, collection, getDocs, query, where, onSnapshot } from "../../Backend/firebase";

interface LiveCueSheetProps {
  projects: Project[];
}

function LiveCueSheet({projects}: LiveCueSheetProps) {
  const navigate = useNavigate();
  const {projectId} = useParams();
  const [cues, setCues] = useState<Cue[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      fetchCues(projectId);
      const foundProject = projects.find(proj => proj.firebaseID === projectId);
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

useEffect(() => {
  const liveCueElement = document.querySelector(".highlighted-cue");
  if (liveCueElement && scrollContainerRef.current) {
    liveCueElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}, [cues]);



  return (
    <>
    <header className="app-header-CueInput">
      <h1 className="project-title inter-bold">{project?.title}</h1>
      <img className="heading-CueInput--logo" src={logo} alt="LiveCue" onClick={() => { navigate("/HomePage"); } } />
      <h1 className="project-date inter-bold">
        {project?.date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
      </h1>
    </header>
    
    <Container fluid className="LiveCueSheet-body d-flex align-items-center justify-content-center">
    <div className="scroll-container-LiveCueSheet" ref={scrollContainerRef}>
        <div className="scroll-content-LiveCueSheet">
          {cues
            .sort((a, b) => a.cueNumber - b.cueNumber)
            .map((cue) => (
              <Card key={cue.cueNumber} className={`LiveCueSheet-Cue ${cue.isLive ? "highlighted-cue" : ""}`}>
                <Card.Body>
                  <Row style={{ marginLeft: 5 }}>
                    <Col xs={3} className={`cueNumber ${cue.isLive ? "highlightedCueNumber" : ""}`}>
                      <h5 className="inter-bold" style={{ margin: 0 }}>
                        {cue.cueNumber}
                      </h5>
                    </Col>
                    <Col className="title-LiveCueSheet">
                      <h5
                        className="inter-bold title-LiveCueSheet"
                        style={{ margin: 4, fontSizeAdjust: "0.475" }}
                      >
                        {" "}
                        {cue.title}
                      </h5>
                    </Col>
                  </Row>
                  <hr className={`hrLiveCueSheet ${cue.isLive ? "highlightedHrLiveCueSheet" : ""}`} />

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

                  <hr style={{ marginTop: 0, marginBottom: 10, }} className={`hrLiveCueSheet ${cue.isLive ? "highlightedHrLiveCueSheet" : ""}`} />

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

export default LiveCueSheet;
