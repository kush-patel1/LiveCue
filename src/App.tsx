import React, { useState } from "react";
import { Routes, Route, HashRouter } from "react-router-dom";
import CueInput from "./Pages/Cue Input/CueInput";
import HomePage from "./Pages/Home Page/HomePage";
import LiveCueSheet from "./Pages/Live Cue Sheet/LiveCueSheet";
import Login from "./Pages/Login Page/Login";
import { User } from "./Interfaces/User/User";
import SignUp from "./Pages/SignUp/SignUp";
import { Project } from "./Interfaces/Project/Project";
import AdminPage from "./Pages/Admin Page/AdminPage";
import './App.css'

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <>
    <HashRouter>
      <Routes>
        <Route path="/CueInput/:projectId" element={<CueInput projects={projects} setProjects={setProjects}/>}/>
        <Route path="/HomePage" element={<HomePage user={user} setUser={setUser} projects={projects} setProjects={setProjects}/>}/>
        <Route path="/LiveCueSheet" element={<LiveCueSheet />} />
        <Route path="/AdminPage/:projectId" element={<AdminPage projects={projects}/>} />
        <Route path="/SignUp" element={<SignUp setUser={setUser} />} />
        <Route path="/" element={<Login setUser={setUser} />} />
      </Routes>
    </HashRouter>
    </>
  );
}

export default App;
