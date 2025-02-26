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

  const projects: Project[] = [
    {id: 1, title: "Hari Jayanti 2024", date: new Date(2024, 3, 14), startTime: new Date("2025-04-06T16:30:00"), endTime: new Date("2025-04-06T18:30:00"), duration: new Date(0,0,0,2,0),
    cues: cues, cueAmount: 35
    },
    {id: 2, title: "DE MMXXIV", date: new Date(2024, 11, 21), startTime: new Date("2024-12-21T17:25:00"), endTime: new Date("2024-12-21T20:16:00"), duration: new Date(0,0,0,2,51),
      cues: cues, cueAmount: 27
    }, 
    {id: 3, title: "Swaminarayan Jayanti 2025", date: new Date(2025, 3, 6), startTime: new Date("2025-04-06T16:30:00"), endTime: new Date("2025-04-06T18:30:00"), duration: new Date(0,0,0,2,0),
    cues: cues, cueAmount: 35
    }, 
    {id: 4, title: "Hari Jayanti 2024", date: new Date(2024, 3, 14), startTime: new Date("2025-04-06T16:30:00"), endTime: new Date("2025-04-06T18:30:00"), duration: new Date(0,0,0,2,0),
      cues: cues, cueAmount: 35
      },
      {id: 5, title: "DE MMXXIV", date: new Date(2024, 11, 21), startTime: new Date("2024-12-21T17:25:00"), endTime: new Date("2024-12-21T20:16:00"), duration: new Date(0,0,0,2,51),
        cues: cues, cueAmount: 27
      }, 
      {id: 6, title: "Hari Jayanti 2025", date: new Date(2025, 3, 6), startTime: new Date("2025-04-06T16:30:00"), endTime: new Date("2025-04-06T18:30:00"), duration: new Date(0,0,0,2,0),
      cues: cues, cueAmount: 35
      },];

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
          {projects.sort((a, b) => b.id - a.id).map((project) => (
      <Card key={project.id} className="HomePage-Project1">
        <Card.Body>
                <h1 className="inter-bold title-HomePage">{project.title.toString()}</h1>
                <h3 className="inter-semibold" style={{paddingBottom: '5%'}}>{project.date.toLocaleDateString([], {month: 'long', day: 'numeric', year: 'numeric'})}</h3>
                <h3 className="inter-semibold">Details</h3>
                <p className="inter-medium" style={{marginBottom: '1%'}}>
                  Start Time: {project.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>
                  End Time: {project.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
                <p className="inter-medium" style={{ paddingBottom: '5%', marginBottom:'1%'}} >
                  Duration: {Math.floor((project.endTime.getTime() - project.startTime.getTime()) / 60000)} minutes
                </p>
                <h3 className="inter-semibold">Cues: {project.cueAmount}</h3>
                <p className="inter-medium" style={{marginBottom: '1%'}}>01: {project.cues[0].title}</p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>02: {project.cues[1].title}</p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>03: {project.cues[2].title}</p>
                <p className="inter-medium" style={{marginBottom: '1%'}}>04: {project.cues[3].title}</p>
                <p className="inter-medium" style={{marginBottom: '1%', paddingBottom: '5%'}}>05: {project.cues[4].title}</p>
                <div className="d-flex justify-content-between">
                  <img src={editButton} height="40px" alt="Edit" onClick={() => navigate("/CueInput")} style={{paddingLeft: '15%'}}/>
                  <img src={liveButton} height="40px" alt="Live" onClick={() => navigate('/LiveCueSheet')} style={{paddingRight: '20%'}} />
                </div>
              </Card.Body>
            </Card>
          ))}
            </div>
            </div>
      </Container>
    </>
  );
}

export default HomePage;