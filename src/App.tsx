import { useState } from "react";
import { Routes, Route, HashRouter } from "react-router-dom";
import CueInput from "./Pages/Cue Input/CueInput";
import HomePage from "./Pages/Home Page/HomePage";
import LiveCueSheet from "./Pages/Live Cue Sheet/LiveCueSheet";
import Login from "./Pages/Login Page/Login";
import { User } from "./Interfaces/User/User";
import SignUp from "./Pages/SignUp/SignUp";
import { Project } from "./Interfaces/Project/Project";
import AdminPage from "./Pages/Admin Page/AdminPage";
import { ProtectedRoute } from "./Components/ProtectedRoute/ProtectedRoute";
import LandingPage from "./Pages/Landing Page/LandingPage";
import PricingPage from "./Pages/Pricing Page/PricingPage";
import ContactPage from "./Pages/Contact Page/ContactPage";
import DemoPage from "./Pages/Demo Page/DemoPage";
import SettingsPage from "./Pages/Settings Page/SettingsPage";
import { ThemeProvider } from "./ThemeContext";
import './App.css';
import './theme.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<SignUp setUser={setUser} />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/settings" element={<SettingsPage projects={projects} setProjects={setProjects} />} />
          <Route path="/CueInput/:projectId" element={<ProtectedRoute><CueInput projects={projects} /></ProtectedRoute>} />
          <Route path="/HomePage" element={<ProtectedRoute><HomePage user={user} setUser={setUser} projects={projects} setProjects={setProjects} /></ProtectedRoute>} />
          <Route path="/LiveCueSheet/:projectId" element={<LiveCueSheet projects={projects} />} />
          <Route path="/AdminPage/:projectId" element={<ProtectedRoute><AdminPage projects={projects} /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
