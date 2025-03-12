import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import CueInput from "./Pages/Cue Input/CueInput";
import HomePage from "./Pages/Home Page/HomePage";
import LiveCueSheet from "./Pages/Live Cue Sheet/LiveCueSheet";
import Login from "./Pages/Login Page/Login";
import { User } from "./Interfaces/User/User";
import SignUp from "./Pages/SignUp/SignUp";
import { Project } from "./Interfaces/Project/Project";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <>
      <Routes>
        <Route
          path="/CueInput/:projectId"
          element={<CueInput projects={projects} setProjects={setProjects}/>}
        />
        <Route
          path="/HomePage"
          element={<HomePage projects={projects} setProjects={setProjects}/>}
        />
        <Route path="/LiveCueSheet" element={<LiveCueSheet />} />
        <Route path="/SignUp" element={<SignUp setUser={setUser} />} />
        <Route path="/" element={<Login setUser={setUser} />} />
      </Routes>
    </>
  );
}

export default App;
