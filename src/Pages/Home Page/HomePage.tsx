import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { AppHeader } from '../../Components/Header/Header';
import { Container, Row, Col, Card } from 'react-bootstrap';
import addMoreButton from '../../Assets/Home-Page/Add-More-Button.png';
import editButton from '../../Assets/Home-Page/Edit-Button.png';
import liveButton from '../../Assets/Home-Page/Live-Button.png';
import { Project } from '../../Interfaces/Project/Project';
import { Cue } from '../../Interfaces/Cue/Cue';

function HomePage() {
  const navigate = useNavigate();

  const cues: Cue[]=[
    {cueNumber: 1, title: "Pre-show Seating", startTime: new Date("2024-12-21T17:25:00"), endTime: new Date("2024-12-21T17:40:00"), presenter: "AV", location: "Sidescreens", avMedia: "Audio", audioSource: "ProPres", sideScreens: "LogoSplash",
      centerScreen: "Blackout", lighting: "Gobos", ambientLights: "Purple", notes: "Slow movements"}, 
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
      <Container fluid className="HomePage-body d-flex align-items-center justify-content-center">
        <Row className="justify-content-center text-center mt-3 mb-4" style={{padding: '2%'}}>
          <Col>
            <img src={addMoreButton} height="70px" alt="Add More" />
          </Col>
        </Row>
        <div className="scroll-container">
          <div className="scroll-content">
          <Card className="HomePage-Project1">
              <Card.Body>
                <h1 className="inter-bold">{project1.title.toString()}</h1>
                <h3 className="inter-semibold" style={{paddingBottom: '5%'}}>{project1.date.toLocaleDateString([], {month: 'long', day: 'numeric', year: 'numeric'})}</h3>
                <h3 className="inter-semibold">Details</h3>
                <p className="inter-medium" style={{marginBottom: '1%'}}>
                  Start Time: {cues[0].startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>
                  End Time: {cues[cuesLength].endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
                <p className="inter-medium" style={{ paddingBottom: '5%', marginBottom:'1%'}} >
                  Duration: {Math.floor((cues[cuesLength].endTime.getTime() - cues[0].startTime.getTime()) / 60000)} minutes
                </p>
                <h3 className="inter-semibold">Cues: {project1.cueAmount}</h3>
                <p className="inter-medium" style={{marginBottom: '1%'}}>01: {cues[0].title}</p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>02: {cues[1].title}</p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>03: {cues[2].title}</p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>04: {cues[3].title}</p>
                <p className="inter-medium" style={{marginBottom: '1%', paddingBottom: '5%'}}>05: {cues[4].title}</p>
                <div className="d-flex justify-content-between">
                  <img src={editButton} height="40px" alt="Edit" onClick={() => navigate("/CueInput")} style={{paddingLeft: '15%'}}/>
                  <img src={liveButton} height="40px" alt="Live" onClick={() => navigate('/LiveCueSheet')} style={{paddingRight: '20%'}} />
                </div>
              </Card.Body>
            </Card>
            <Card className="HomePage-Project1">
              <Card.Body>
              <h1 className="inter-bold">Untitled</h1>
                <h3 className="inter-semibold" style={{paddingBottom: '5%'}}>Date</h3>
                <h3 className="inter-semibold">Details</h3>
                <p className="inter-medium" style={{marginBottom: '1%'}}>
                  Start Time:
                </p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>
                  End Time:
                </p>
                <p className="inter-medium" style={{ paddingBottom: '5%', marginBottom:'1%'}} >
                  Duration: 
                </p>
                <h3 className="inter-semibold">Cues: </h3>
                <p className="inter-medium" style={{marginBottom: '1%'}}>01: </p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>02: </p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>03: </p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>04: </p>
                <p className="inter-medium" style={{marginBottom: '1%', paddingBottom: '5%'}}>05: </p>
                <div className="d-flex justify-content-between">
                  <img src={editButton} height="40px" alt="Edit" onClick={() => navigate("/CueInput")} style={{paddingLeft: '15%'}}/>
                  <img src={liveButton} height="40px" alt="Live" onClick={() => navigate('/LiveCueSheet')} style={{paddingRight: '20%'}} />
                </div>
              </Card.Body>
            </Card>
            
          </div>
        </div>
      </Container>
    </>
  );
}

export default HomePage;
