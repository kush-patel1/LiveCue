import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LiveCueSheet.css";
import { AppHeader } from "../../Components/Header/Header";
import { Container, Row, Col, Card } from "react-bootstrap";
import addMoreButton from "../../Assets/Home-Page/Add-More-Button.png";
import { Project } from "../../Interfaces/Project/Project";
import { Cue } from "../../Interfaces/Cue/Cue";

function CueInput() {
  const navigate = useNavigate();

  /*
  const cues: Cue[]=[
    {cueNumber: 1, title: "Pre-show Seating", startTime: new Date("2024-12-21T17:25:00"), endTime: new Date("2024-12-21T17:40:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Logo Splash",
      centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Purple", notes: "Blackout, curtains closed, slow gobo movements, haze, audio is MM Jingle"}, 
      {cueNumber: 2, title: "Countdown", startTime: new Date("2024-12-21T17:40:00"), endTime: new Date("2024-12-21T17:45:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
        centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Blackout, curtains closed, slow gobo movements, haze, 5 minute countdown video with pictures/video clips as smrutis of our Mandir"}, 
        {cueNumber: 3, title: "Manglacharan", startTime: new Date("2024-12-21T17:45:00"), endTime: new Date("2024-12-21T17:48:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Mangalcharan Slide",
          centerScreen: "Mangalacharan Center Video", lighting: "Gobos", ambientLights: "Blue", notes: "Blackout, curtains open"},
          {cueNumber: 4, title: "Bang Video", startTime: new Date("2024-12-21T17:48:00"), endTime: new Date("2024-12-21T17:51:00"), presenter: "AV", location: "Center & Sidescreens", avMedia: "Audio", audioSource: "Resolume", sideScreens: "Side Bang Video",
            centerScreen: "Center Bang Video", lighting: "Gobos", ambientLights: "Blue", notes: "Blackout, curtains open, fast gobo movements, haze, volume high, bass boost, sync up all 3 screens so movements across screens are smooth."},
              {cueNumber: 5, title: "Welcome Emcee", startTime: new Date("2024-12-21T17:51:00"), endTime: new Date("2024-12-21T17:53:00"), presenter: "AV", location: "Sidescreens", avMedia: "Instrumental", audioSource: "Live & ProPres", sideScreens: "Countdown Vid",
                centerScreen: "Welcome Emcee Backdrops 1-3", lighting: "Center Stage Spotlight", ambientLights: "Blue", notes: "Light instrumental, Move Spots with speaker"},
                {cueNumber: 6, title: "Deep Pragatya", startTime: new Date("2024-12-21T17:40:00"), endTime: new Date("2024-12-21T17:45:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                  centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"}, 
                  {cueNumber: 7, title: "Ghost Emcee 1: Mandir", startTime: new Date("2024-12-21T17:45:00"), endTime: new Date("2024-12-21T17:48:00"), presenter: "AV", location: "Center & Sidescreens", avMedia: "Audio", audioSource: "Resolume", sideScreens: "Bang",
                    centerScreen: "Bang", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                    {cueNumber: 8, title: "Delaware History Video", startTime: new Date("2024-12-21T17:48:00"), endTime: new Date("2024-12-21T17:51:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                      centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                      {cueNumber: 9, title: "Skit Emcee 1", startTime: new Date("2024-12-21T17:51:00"), endTime: new Date("2024-12-21T17:53:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                        centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                        {cueNumber: 10, title: "Dynamic Speech", startTime: new Date("2024-12-21T17:51:00"), endTime: new Date("2024-12-21T17:53:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                          centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                          {cueNumber: 11, title: "P. Sant Speech", startTime: new Date("2024-12-21T17:25:00"), endTime: new Date("2024-12-21T17:40:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Logo Splash",
                            centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Purple", notes: "Blackout, curtains closed, slow gobo movements, haze, audio is MM Jingle"}, 
                            {cueNumber: 12, title: "MSM Katha 1", startTime: new Date("2024-12-21T17:40:00"), endTime: new Date("2024-12-21T17:45:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                              centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Blackout, curtains closed, slow gobo movements, haze, 5 minute countdown video with pictures/video clips as smrutis of our Mandir"}, 
                              {cueNumber: 13, title: "Skit Emcee 2", startTime: new Date("2024-12-21T17:45:00"), endTime: new Date("2024-12-21T17:48:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Mangalcharan Slide",
                                centerScreen: "Mangalacharan Center Video", lighting: "Gobos", ambientLights: "Blue", notes: "Blackout, curtains open"},
                                {cueNumber: 14, title: "Community Services Video", startTime: new Date("2024-12-21T17:48:00"), endTime: new Date("2024-12-21T17:51:00"), presenter: "AV", location: "Center & Sidescreens", avMedia: "Audio", audioSource: "Resolume", sideScreens: "Side Bang Video",
                                  centerScreen: "Center Bang Video", lighting: "Gobos", ambientLights: "Blue", notes: "Blackout, curtains open, fast gobo movements, haze, volume high, bass boost, sync up all 3 screens so movements across screens are smooth."},
                                    {cueNumber: 15, title: "Spoken Word Poem", startTime: new Date("2024-12-21T17:51:00"), endTime: new Date("2024-12-21T17:53:00"), presenter: "AV", location: "Sidescreens", avMedia: "Instrumental", audioSource: "Live & ProPres", sideScreens: "Countdown Vid",
                                      centerScreen: "Welcome Emcee Backdrops 1-3", lighting: "Center Stage Spotlight", ambientLights: "Blue", notes: "Light instrumental, Move Spots with speaker"},
                                      {cueNumber: 16, title: "P. Sant Speech 2", startTime: new Date("2024-12-21T17:40:00"), endTime: new Date("2024-12-21T17:45:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                                        centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"}, 
                                        {cueNumber: 17, title: "PSM Katha 1", startTime: new Date("2024-12-21T17:45:00"), endTime: new Date("2024-12-21T17:48:00"), presenter: "AV", location: "Center & Sidescreens", avMedia: "Audio", audioSource: "Resolume", sideScreens: "Bang",
                                          centerScreen: "Bang", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                                          {cueNumber: 18, title: "Skit Emcee 3", startTime: new Date("2024-12-21T17:48:00"), endTime: new Date("2024-12-21T17:51:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                                            centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                                            {cueNumber: 19, title: "I-Family Becomes Mandir Video", startTime: new Date("2024-12-21T17:51:00"), endTime: new Date("2024-12-21T17:53:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                                              centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                                              {cueNumber: 20, title: "E-Family Becomes Mandir", startTime: new Date("2024-12-21T17:51:00"), endTime: new Date("2024-12-21T17:53:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                                                centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
  ]

  const project1: Project = {
    id:1, title: "DE MMXXIV", date: new Date(2024, 11, 21), startTime: new Date("2024-12-21T17:25:00"), endTime: new Date("2024-12-21T20:16:00"), duration: new Date(0,0,0,2,51),
    cues: cues, cueAmount: 27
  }
*/

  const [cueAmount, setCueAmount] = useState(5); // Default to 5 cues
  const [cues, setCues] = useState<Cue[]>(
    Array.from({ length: cueAmount }, (_, i) => ({
      cueNumber: i + 1,
      title: "",
      startTime: new Date(),
      endTime: new Date(),
      presenter: "",
      location: "",
      avMedia: "",
      audioSource: "",
      sideScreens: "",
      centerScreen: "",
      lighting: "",
      ambientLights: "",
      notes: "",
    })),
  );

  // Update field when user edits input
  const handleChange = (index: number, field: keyof Cue, value: string) => {
    const updatedCues = [...cues];
    updatedCues[index] = { ...updatedCues[index], [field]: value };
    setCues(updatedCues);
  };

  // Handle cue amount change
  const handleCueAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = Math.max(1, parseInt(e.target.value) || 1); // Ensure at least 1 cue
    setCueAmount(amount);
    setCues(
      Array.from({ length: amount }, (_, i) => ({
        cueNumber: i + 1,
        title: "",
        startTime: new Date(),
        endTime: new Date(),
        presenter: "",
        location: "",
        avMedia: "",
        audioSource: "",
        sideScreens: "",
        centerScreen: "",
        lighting: "",
        ambientLights: "",
        notes: "",
      })),
    );
  };

  return (
    <>
      <AppHeader />
      <Container
        fluid
        className="CueInput-body d-flex align-items-center justify-content-center"
      >
        <div className="scroll-container-cueInput">
          <div className="scroll-content-cueInput">
            {cues
              .sort((a, b) => a.cueNumber - b.cueNumber)
              .map((cue) => (
                <Card key={cue.cueNumber} className="CueInput-Cue">
                  <Card.Body>
                    <Row style={{ marginLeft: 5 }}>
                      <Col xs={3} className="cueNumber">
                        <h5 className="inter-bold" style={{ margin: 0 }}>
                          {cue.cueNumber}
                        </h5>
                      </Col>
                      <Col className="title-CueInput">
                        <h5
                          className="inter-bold title-CueInput"
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
              <Col>
                <img src={addMoreButton} height="70px" alt="Add More" />
              </Col>
            </Row>
          </div>
        </div>
      </Container>
    </>
  );
}

export default CueInput;
