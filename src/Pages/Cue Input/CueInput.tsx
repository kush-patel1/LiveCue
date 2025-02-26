import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CueInput.css';
import { AppHeader } from '../../Components/Header/Header';
import { Container, Row, Col, Card } from 'react-bootstrap';
import addMoreButton from '../../Assets/Home-Page/Add-More-Button.png';
import editButton from '../../Assets/Home-Page/Edit-Button.png';
import liveButton from '../../Assets/Home-Page/Live-Button.png';
import { Project } from '../../Interfaces/Project/Project';
import { Cue } from '../../Interfaces/Cue/Cue';

function CueInput() {
  const navigate = useNavigate();

  const cues: Cue[]=[
    {cueNumber: 1, title: "Pre-show Seating", startTime: new Date("2024-12-21T17:25:00"), endTime: new Date("2024-12-21T17:40:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Logo Splash",
      centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Purple", notes: "Blackout, curtains closed, slow gobo movements, haze, audio is MM Jingle"}, 
      {cueNumber: 2, title: "Countdown", startTime: new Date("2024-12-21T17:40:00"), endTime: new Date("2024-12-21T17:45:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
        centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"}, 
        {cueNumber: 3, title: "Bang Video", startTime: new Date("2024-12-21T17:45:00"), endTime: new Date("2024-12-21T17:48:00"), presenter: "AV", location: "Center & Sidescreens", avMedia: "Audio", audioSource: "Resolume", sideScreens: "Bang",
          centerScreen: "Bang", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
          {cueNumber: 4, title: "Manglacharan", startTime: new Date("2024-12-21T17:48:00"), endTime: new Date("2024-12-21T17:51:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
            centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
            {cueNumber: 5, title: "Welcome Emcee", startTime: new Date("2024-12-21T17:51:00"), endTime: new Date("2024-12-21T17:53:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
              centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
              {cueNumber: 2, title: "Countdown", startTime: new Date("2024-12-21T17:40:00"), endTime: new Date("2024-12-21T17:45:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"}, 
                {cueNumber: 3, title: "Bang Video", startTime: new Date("2024-12-21T17:45:00"), endTime: new Date("2024-12-21T17:48:00"), presenter: "AV", location: "Center & Sidescreens", avMedia: "Audio", audioSource: "Resolume", sideScreens: "Bang",
                  centerScreen: "Bang", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                  {cueNumber: 4, title: "Manglacharan", startTime: new Date("2024-12-21T17:48:00"), endTime: new Date("2024-12-21T17:51:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                    centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"},
                    {cueNumber: 5, title: "Welcome Emcee", startTime: new Date("2024-12-21T17:51:00"), endTime: new Date("2024-12-21T17:53:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "Countdown Vid",
                      centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Blue", notes: "Slow movements"}
  ]

  let cuesLength: number = cues.length - 1;

  const project1: Project = {
    title: "DE MMXXIV", date: new Date(2024, 11, 21), startTime: new Date("2024-12-21T17:25:00"), endTime: new Date("2024-12-21T20:16:00"), duration: new Date(0,0,0,2,51),
    cues: cues, cueAmount: 27
  }
  return (
    <>
      <AppHeader />
      <Container fluid className="CueInput-body d-flex align-items-center justify-content-center">
      <div className="scroll-container-cueInput">
  <div className="scroll-content-cueInput">
    {cues.map((cue) => (
      <Card key={cue.cueNumber} className="CueInput-Cue">
        <Card.Body>
          <Row>
            <Col xs={3} className='cueNumber'>
              <h5 className="inter-bold" style={{ margin: 0 }}>{cue.cueNumber}</h5>
            </Col>
            <Col>
              <h5 className="inter-bold" style={{ margin: 4 }}> {cue.title}</h5>
            </Col>
          </Row>
          <hr style={{ borderTop: '3px solid #578493', borderRadius: '10px', minWidth: '325px', marginTop: 10, marginBottom: 0, borderStyle: "solid", opacity: '1'}} />

          <Row className="align-items-center">
            <Col xs={5}>
              <p className='inter-medium' style={{ margin: 10 }}>Start: {cue.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
            </Col>
            <Col xs={2} className="d-flex justify-content-center" style={{ marginLeft: 11 }}>
              <div className="vertical-line"></div>
            </Col>
            <Col xs={1} style={{ paddingLeft: 0 }}>
              <p className='inter-medium' style={{ margin: 10 }}>End: {cue.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
            </Col>
          </Row>
          <hr style={{ borderTop: '3px solid #578493', borderRadius: '10px', minWidth: '325px', marginTop: 0, borderStyle: "solid", opacity: '1'}} />

          <Row className='section'>
            <p className='inter-medium' style={{ margin: 5 }}>Presenter: <span className='inter-bold'> {cue.presenter}</span></p>
          </Row>
          <Row className='section'>
            <p className='inter-medium' style={{ margin: 5 }}>Location: <span className='inter-bold'> {cue.location}</span></p>
          </Row>
          <Row className='section'>
            <p className='inter-medium' style={{ margin: 5 }}>AV Media/Audio: <span className='inter-bold'> {cue.avMedia}</span></p>
          </Row>
          <Row className='section'>
            <p className='inter-medium' style={{ margin: 5 }}>Audio Source: <span className='inter-bold'> {cue.audioSource}</span></p>
          </Row>
          <Row className='section'>
            <p className='inter-medium' style={{ margin: 5 }}>Side Screens: <span className='inter-bold' style={{ margin: 0 }}> {cue.sideScreens}</span></p>
          </Row>
          <Row className='section'>
            <p className='inter-medium' style={{ margin: 5 }}>Center Screen: <span className='inter-bold'> {cue.centerScreen}</span></p>
          </Row>
          <Row className='section'>
            <p className='inter-medium' style={{ margin: 5 }}>Lighting: <span className='inter-bold'> {cue.lighting}</span></p>
          </Row>
          <Row className='section'>
            <p className='inter-medium' style={{ margin: 5 }}>Ambient Lights: <span className='inter-bold'> {cue.ambientLights}</span></p>
          </Row>
          <Row className="section d-flex justify-content-start w-100">
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 14 }}>Notes:</p>
            </Col>
            <Col className="p-1">
              <p className="inter-bold text-wrap" style={{ margin: 0 }}>{cue.notes}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    ))}
    </div>
    </div>
        <Row className="justify-content-center text-center mt-3 mb-4" style={{padding: '2%'}}>
          <Col>
            <img src={addMoreButton} height="70px" alt="Add More" />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default CueInput;
