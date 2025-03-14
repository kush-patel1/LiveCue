import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CueInput.css';
import logo from '../../Assets/Logo/LIVECUE-Logo.png'
import { Container, Row, Col, Card, Form } from 'react-bootstrap';
import addMoreButton from '../../Assets/Home-Page/Add-More-Button.png';
import { Project } from '../../Interfaces/Project/Project';
import { Cue } from '../../Interfaces/Cue/Cue';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

interface CueInputProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

function CueInput({ projects, setProjects }: CueInputProps) {
  const navigate = useNavigate();
  const {projectId} = useParams();
  const project = projects.find(p => p.id === Number(projectId));

  const [cueAmount, setCueAmount] = useState(project?.cueAmount ?? 5); // Default to 5 cues
  const [cues, setCues] = useState<Cue[]>(Array.from({ length: cueAmount }, (_, i) => ({
    cueNumber: i + 1,
    title: '',
    startTime: new Date(0,0,0,12,0,0),
    endTime: new Date(0,0,0,12,0,0),
    presenter: '',
    location: '',
    avMedia: '',
    audioSource: '',
    sideScreens: '',
    centerScreen: '',
    lighting: '',
    ambientLights: '',
    notes: '',
  })));

  const updateProjectCues = (updatedCues: Cue[]) => {
    if (!project) return;
  
    const updatedProjects = projects.map(p => 
      p.id === project.id ? { ...p, cues: updatedCues, cueAmount: updatedCues.length } : p
    );
  
    setProjects(updatedProjects);
  };
  
  const handleInputChange = (index: number, field: keyof Cue, value: string) => {
    const updatedCues = [...cues];
    updatedCues[index] = { ...updatedCues[index], [field]: value };
    setCues(updatedCues);
    updateProjectCues(updatedCues);
  };
  
  const handleTimeChange = (index: number, field: keyof Cue, value: dayjs.Dayjs | null) => {
    if (!value) return;
    const updatedCues = [...cues];
    updatedCues[index] = { ...updatedCues[index], [field]: value.toDate() };
    setCues(updatedCues);
    updateProjectCues(updatedCues);
  };


  // Handle cue amount change
  const addCue = () => {
    setCueAmount(prevAmount => prevAmount + 1);
    setCues(prevCues => [
      ...prevCues,
      {
        cueNumber: prevCues.length + 1,
        title: '',
        startTime: new Date(0, 0, 0, 12, 0, 0),
        endTime: new Date(0, 0, 0, 12, 0, 0),
        presenter: '',
        location: '',
        avMedia: '',
        audioSource: '',
        sideScreens: '',
        centerScreen: '',
        lighting: '',
        ambientLights: '',
        notes: '',
      },
    ]);
  };
  
  useEffect(() => {
    if (project?.cues && project.cues.length > 0) {
      setCues(project.cues);
    }
  }, [project]);

  return (
    <>
       <header className="app-header-CueInput">
        <h1 className="project-title inter-bold">{project?.title}</h1>
        <img className="heading-CueInput--logo" src={logo} alt="LiveCue" onClick={() => {navigate("/HomePage")}}/>
        <h1 className="project-date inter-bold">
          {project?.date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
        </h1>
      </header>


      <Container fluid className="CueInput-body d-flex align-items-center justify-content-center">
      <div className="scroll-container-cueInput">
  <div className="scroll-content-cueInput">
    {cues.sort((a, b) => a.cueNumber - b.cueNumber).map((cue, index) => (
      <Card key={cue.cueNumber} className="CueInput-Cue">
        <Card.Body>
          
          <Row style={{marginLeft: 5}}>

            {/* Cue Number Box */}
            <Col xs={3} className='cueNumber'>
              <h5 className="inter-bold" style={{ margin: 0 }}>{cue.cueNumber}</h5>
            </Col>

            {/* Title */}
            <Col className='title-CueInput'>
            <Form className="inter-bold title-CueInput" style={{ margin: 4}}>
            <div
                    contentEditable
                    className="notion-input"
                    //placeholder='Enter Title'
                    onBlur={(e) => handleInputChange(index, "title", e.target.innerText)}
                  >
                    {cue.title}
            </div>
            </Form>
            </Col>

          </Row>

          {/* Horizontal Line for under the cue number and title*/}
          <hr style={{ borderTop: '3px solid #578493', borderRadius: '10px', minWidth: '290px', marginTop: 10, marginBottom: 0, borderStyle: "solid", opacity: '1', marginLeft: -12}} />

          <Row>

            {/* Start Time */}
            <Col xs={5}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label = 'Start Time: '
                slotProps={{ textField: { size: 'small', sx: {
                  backgroundColor: "transparent", // Transparent background
                  fontSize: "0.75rem", // Smaller font size
                  "& .MuiInputBase-input": {
                    marginTop: "10px",
                    color: "white", // White text
                    fontSize: "1rem", // Smaller text inside the input
                    padding: "4px 8px", // Adjust padding to reduce height
                  },
                  "& .MuiOutlinedInput-root": {
                    marginTop: "5px",
                    minHeight: "30px", // Smaller input field height
                    "& fieldset": {
                      borderColor: "transparent", // White border
                    },
                    "&:hover fieldset": {
                      borderColor: "transparent", // White border on hover
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "transparent", // White border when focused
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: 'inter-bold',
                    marginTop: "10px",
                    marginLeft: '-6px',
                    color: "white", // White label text
                    fontSize: "1.2rem", // Smaller label
                  },
                  "& .MuiSvgIcon-root": {
                    marginRight: -4,
                    color: "white", // White clock icon
                    fontSize: "1rem", // Smaller clock icon
                  },
                }, }}}
                className='CueInput-TimePicker'
                value={dayjs(cue.startTime)}
                onChange={(value) => handleTimeChange(index, "startTime", value)}/>  
            </LocalizationProvider>
              {/*<p className='inter-medium' style={{ margin: 10, marginLeft: 0 }}>Start: {cue.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>*/}
            </Col>

            {/* Verticle Line */}
            <Col xs={2} className="d-flex justify-content-center" style={{ marginLeft: 0 }}>
              <div className="vertical-line"></div>
            </Col>

            {/* End Time*/}
            <Col xs={1} style={{ paddingLeft: 0 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label = 'End Time: '
                slotProps={{ textField: { size: 'small', sx: {
                  backgroundColor: "transparent", // Transparent background
                  fontSize: "0.75rem", // Smaller font size
                  "& .MuiInputBase-input": {
                    marginTop: "10px",
                    marginLeft: "-10px",
                    color: "white", // White text
                    fontSize: "1rem", // Smaller text inside the input
                    padding: "4px 8px", // Adjust padding to reduce height
                  },
                  "& .MuiOutlinedInput-root": {
                    marginTop: "5px",
                    minHeight: "30px", // Smaller input field height
                    "& fieldset": {
                      borderColor: "transparent", // White border
                    },
                    "&:hover fieldset": {
                      borderColor: "transparent", // White border on hover
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "transparent", // White border when focused
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: 'inter-bold',
                    marginTop: "10px",
                    marginLeft: '-16px',
                    color: "white", // White label text
                    fontSize: "1.2rem", // Smaller label
                  },
                  "& .MuiSvgIcon-root": {
                    marginRight: -1,
                    color: "white", // White clock icon
                    fontSize: "1rem", // Smaller clock icon
                  },
                }, }}}
                className='CueInput-TimePicker'
                value={dayjs(cue.endTime)}
                onChange={(value) => handleTimeChange(index, "endTime", value)}/>  
            </LocalizationProvider>

              {/*<p className='inter-medium' style={{ margin: 10, marginLeft: -10 }}>End: {cue.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>*/}
            </Col>

          </Row>

          {/* Horizontal line for under the start time and end time */}
          <hr style={{ borderTop: '3px solid #578493', borderRadius: '10px', minWidth: '290px', marginTop: 0, borderStyle: "solid", opacity: '1', marginLeft: -12}} />


          <Row className="section">

            {/* Presenter Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>Presenter: </p>
            </Col>

            {/* Presenter Form */}
            <Col className="p-1">
            <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='presenter'
                    onBlur={(e) => handleInputChange(index, "presenter", e.target.innerText)}
                  >
                    {cue.presenter}
                </div>
            </Form>
            </Col>

          </Row>

          <Row className="section">

            {/* Location Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>Location: </p>
            </Col>

            {/* Loaction Form */}
            <Col className="p-1">
            <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='location'
                    onBlur={(e) => handleInputChange(index, "location", e.target.innerText)}
                  >
                    {cue.location}
                </div>
            </Form>
            </Col>

          </Row>

          <Row className="section">

            {/* AV Media Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>AV Media: </p>
            </Col>

            {/* AV Media Form */}
            <Col className="p-1">
            <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='avMedia'
                    onBlur={(e) => handleInputChange(index, "avMedia", e.target.innerText)}
                  >
                    {cue.avMedia}
                </div>
            </Form>
            </Col>

          </Row>

          <Row className="section">

            {/* Audio Source Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>Audio Source: </p>
            </Col>

            {/* Audio Source Form */}
            <Col className="p-1">
            <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='audioSource'
                    onBlur={(e) => handleInputChange(index, "audioSource", e.target.innerText)}
                  >
                    {cue.audioSource}
                </div>
            </Form>
            </Col>

          </Row>

          <Row className="section">

            {/* Side Screens Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>Side Screens: </p>
            </Col>

            {/* Side Screens Form */}
            <Col className="p-1">
            <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='sideScreens'
                    onBlur={(e) => handleInputChange(index, "sideScreens", e.target.innerText)}
                  >
                    {cue.sideScreens}
                </div>
            </Form>
            </Col>

          </Row>

          <Row className="section">

            {/* Center Screen Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>Center Screen: </p>
            </Col>

            {/* Center Screen Form */}
            <Col className="p-1">
            <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='centerScreen'
                    onBlur={(e) => handleInputChange(index, "centerScreen", e.target.innerText)}
                  >
                    {cue.centerScreen}
                </div>
            </Form>
            </Col>

          </Row>

          <Row className="section">

            {/* Lighting Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>Lighting: </p>
            </Col>

            {/* Lighting Heading Form */}
            <Col className="p-1">
              <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='lighting'
                    onBlur={(e) => handleInputChange(index, "lighting", e.target.innerText)}
                  >
                    {cue.lighting}
                </div>
            </Form>
            </Col>

          </Row>
          
          <Row className="section">

            {/* Ambient Lights Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>Ambient Lights:</p>
            </Col>

            {/* Ambient Lights Form */}
            <Col className="p-1">
              <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='ambient lighting'
                    onBlur={(e) => handleInputChange(index, "ambientLights", e.target.innerText)}
                  >
                    {cue.ambientLights}
                </div>
            </Form>
            </Col>

          </Row>

          <Row className="section">

            {/* Notes Heading */}
            <Col xs="auto" className="p-1">
              <p className="inter-medium" style={{ marginLeft: 13, fontSize: '14px', marginBottom: 0 }}>Notes:</p>
            </Col>

            {/* Notes Form */}
            <Col className="p-1">
            <Form >
                <div
                    contentEditable
                    className="notion-input inter-bold text-wrap"
                    style={{ margin: 0, fontSize: '14px' }}
                    //placeholder='notes'
                    onBlur={(e) => handleInputChange(index, "notes", e.target.innerText)}
                  >
                    {cue.notes}
                </div>
            </Form>
            </Col>

          </Row>
        </Card.Body>
      </Card>
    ))}
    <Row className="justify-content-center mt-3 mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Col>
            <img src={addMoreButton} height="70px" alt="Add More" onClick = {addCue} style={{ cursor: "pointer" }} />
          </Col>
        </Row>
    </div>
    </div>
      </Container>
    </>
  );
}

export default CueInput;
