import { useState, useEffect } from "react";
import { Routes, Route, HashRouter, useLocation } from "react-router-dom";
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
import DemoHub from "./Demo/DemoHub";
import DemoEditor from "./Demo/DemoEditor";
import DemoAdmin from "./Demo/DemoAdmin";
import DemoLive from "./Demo/DemoLive";
import SettingsPage from "./Pages/Settings Page/SettingsPage";
import CheckoutSuccess from "./Pages/Checkout/CheckoutSuccess";
import AcceptInvite from "./Pages/AcceptInvite/AcceptInvite";
import { ThemeProvider } from "./ThemeContext";
import './App.css';
import './theme.css';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <ThemeProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<SignUp setUser={setUser} />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/demo" element={<DemoHub />} />
          <Route path="/demo/editor" element={<DemoEditor />} />
          <Route path="/demo/admin" element={<DemoAdmin />} />
          <Route path="/demo/live" element={<DemoLive />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
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
