import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import logo from '../../Assets/Logo/LIVECUE-Logo.png'
import { Container, Row, Col, Card, Modal, Form, Button } from 'react-bootstrap';
import addMoreButton from '../../Assets/Home-Page/Add-More-Button.png';
import editButton from '../../Assets/Home-Page/Edit-Button.png';
import liveButton from '../../Assets/Home-Page/Live-Button.png';
import { Project } from '../../Interfaces/Project/Project';
import { db, collection, addDoc, getDocs, query, where, auth } from '../../Backend/firebase'; // Firebase imports
import { User } from '../../Interfaces/User/User';
import { User as FirebaseUser, signOut } from "firebase/auth";
import { onAuthStateChanged } from 'firebase/auth';
import { Cue } from '../../Interfaces/Cue/Cue';


interface HomePageProps {
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  projects: Project[];
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}


const HomePage: React.FC<HomePageProps> = ({user, projects, setProjects, setUser }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDate, setNewProjectDate] = useState('');
  const [newProjectStartTime, setNewProjectStartTime] = useState('');
  const [newProjectEndTime, setNewProjectEndTime] = useState('');

  const [newProjectCueAmount, setNewProjectCueAmount] = useState(1);

  const getNextProjectID = () => {
    return projects.length > 0 ? Math.max(...projects.map(p => p.projectID)) + 1 : 1;
  };

  const handleAddProject = async () => {
    if (!newProjectTitle || !newProjectDate || !newProjectStartTime || !newProjectEndTime) {
      alert("Please enter all fields!");
      return;
    }
  
    if (!user) {
      alert("You must be logged in to add a project.");
      return;
    }
  
    const startTime = new Date(`${newProjectDate}T${newProjectStartTime}:00`);
    const endTime = new Date(`${newProjectDate}T${newProjectEndTime}:00`);
  
    if (startTime >= endTime) {
      alert("End time must be after start time!");
      return;
    }
  
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    const newID = getNextProjectID();
  
    const newProject: Project = {
      firebaseID: '', // Will be set by Firestore
      projectID: newID,
      title: newProjectTitle,
      date: new Date(newProjectDate),
      startTime,
      endTime,
      duration: new Date(0, 0, 0, Math.floor(durationMinutes / 60), durationMinutes % 60),
      cues: [],
      cueAmount: newProjectCueAmount,
      owner: user.id, // Store the user ID in the project
    };
  
    try {
      const docRef = await addDoc(collection(db, "projects"), newProject);
      newProject.firebaseID = docRef.id; // Assign the Firestore ID to the project
      setProjects([...projects, newProject]); // Update local state
    } catch (error) {
      console.error("Error adding project:", error);
      alert("Failed to add project. Try again.");
    }
  
    // Reset form and close modal
    setShowModal(false);
    setNewProjectTitle('');
    setNewProjectDate('');
    setNewProjectStartTime('');
    setNewProjectEndTime('');
    setNewProjectCueAmount(1);
  };

  function mapFirebaseUserToAppUser(firebaseUser: FirebaseUser | null): User | null {
    if (!firebaseUser) return null; 
  
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      firstName: "",  // Fetch from Firestore if needed
      lastName: "",   // Fetch from Firestore if needed
      password: "",   // Firebase does not return passwords
    };
  }
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const appUser = mapFirebaseUserToAppUser(firebaseUser);
      setUser(appUser);
  
      if (appUser) {
        await fetchProjects(appUser.id);  // Ensure fetchProjects uses correct ID
      } else {
        setProjects([]);
      }
    });
  
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchProjects = async (userId: string) => {
    try {
      const q = query(collection(db, "projects"), where("owner", "==", userId));
      const querySnapshot = await getDocs(q);
      const userProjects: Project[] = [];
  
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const projectId = doc.id;
        
        // Fetch cues for the project
        const cues = await fetchCues(projectId);
  
        userProjects.push({
          firebaseID: projectId,
          projectID: data.projectID,
          title: data.title,
          date: data.date.toDate(),
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
          duration: data.duration.toDate(),
          cues: cues,  // Include fetched cues
          cueAmount: data.cueAmount,
          owner: data.owner,
        });
      }
  
      setProjects(userProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchCues = async (projectId: string): Promise<Cue[]> => {
    try {
      const q = query(collection(db, "cues"), where("projectRef", "==", projectId));
      const querySnapshot = await getDocs(q);
      const fetchedCues = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cue));
  
      // Sort cues by cueNumber before returning
      return fetchedCues.sort((a, b) => a.cueNumber - b.cueNumber);
    } catch (error) {
      console.error("Error fetching cues:", error);
      return [];
    }
  };

  return (
    <>
      <header className="app-header-CueInput">
        <div className="header-spacer"></div> {/* Spacer for centering */}
        <img className="heading-CueInput--logo" src={logo} alt="LiveCue" onClick={() => {navigate("/HomePage")}}/>
        <Button onClick={handleLogout} className='logout-button inter-medium'>Log Out</Button>
      </header>

      <Container fluid className="HomePage-body d-flex align-items-center justify-content-center">
        <Row className="justify-content-center text-center mt-3 mb-4" style={{ padding: '2%' }}>
          <Col>
            <img
              src={addMoreButton}
              height={"60%"}
              alt="Add More"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowModal(true)}
            />
          </Col>
        </Row>
        <div className="scroll-container">
          <div className="scroll-content">
            {projects.sort((a, b) => b.projectID - a.projectID).map((project) => (
              <Card key={project.firebaseID} className="HomePage-Project1">
                <Card.Body>
                  <h1 className="inter-bold title-HomePage">{project.title}</h1>
                  <h3 className="inter-semibold" style={{ paddingBottom: '5%' }}>
                    {project.date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <h3 className="inter-semibold">Details</h3>
                  <p className="inter-medium" style={{ marginBottom: '1%' }}>
                    Start Time: {project.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                  <p className="inter-medium" style={{ marginBottom: '1%' }}>
                    End Time: {project.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                  <p className="inter-medium" style={{ paddingBottom: '5%', marginBottom: '1%' }}>
                      Duration: {`${project.duration.getHours()}hr ${project.duration.getMinutes()}min`}
                  </p>
                  <h3 className="inter-semibold">Cues: {project.cueAmount}</h3>
                  {project.cues.length > 0 ? (
                    project.cues.slice(0, 5).map((cue, index) => (
                      <p key={index} className="inter-medium" style={{ marginBottom: '1%' }}>
                        0{index + 1}: {cue.title}
                      </p>
                    ))
                  ) : (
                    <p className="inter-medium" style={{ marginBottom: '1%' }}>No cues added yet</p>
                  )}
                  <div className="d-flex justify-content-between mt-auto">
                  <img 
                    src={editButton} 
                    height="40px" 
                    alt="Edit" 
                    onClick={() => navigate(`/CueInput/${project.firebaseID}`)}  // Pass project ID in URL
                    style={{ paddingLeft: '15%', cursor: 'pointer'}} 
                  />
                    <img src={liveButton} height="40px" alt="Live" onClick={() => navigate(`/AdminPage/${project.firebaseID}`)} style={{ paddingRight: '20%' }} />
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      </Container>
      <Modal show={showModal} onHide={() => setShowModal(false)} className="modal-dark">

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
                style={{backgroundColor: '#141414', borderColor: '$141414', color: '#fff6ee'}}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Date</Form.Label>
              <Form.Control
                type="date"
                value={newProjectDate}
                onChange={(e) => setNewProjectDate(e.target.value)}
                style={{backgroundColor: '#141414', borderColor: '$141414', color: '#fff6ee'}}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Start Time</Form.Label>
              <Form.Control
                type="time"
                value={newProjectStartTime}
                onChange={(e) => setNewProjectStartTime(e.target.value)}
                style={{backgroundColor: '#141414', borderColor: '$141414', color: '#fff6ee'}}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project End Time</Form.Label>
              <Form.Control
                type="time"
                value={newProjectEndTime}
                onChange={(e) => setNewProjectEndTime(e.target.value)}
                style={{backgroundColor: '#141414', borderColor: '$141414', color: '#fff6ee'}}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Cue Amount</Form.Label>
              <Form.Control
                type="number"
                value={newProjectCueAmount}
                onChange={(e) => setNewProjectCueAmount(parseInt(e.target.value, 10))}
                style={{backgroundColor: '#141414', borderColor: '$141414', color: '#fff6ee'}}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddProject}>Add Project</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default HomePage;