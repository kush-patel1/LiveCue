import React from 'react';
import {Routes, Route} from 'react-router-dom';
import CueInput from './Pages/Cue Input/CueInput';
import HomePage from './Pages/Home Page/HomePage';
import LiveCueSheet from './Pages/Live Cue Sheet/LiveCueSheet';
import Login from './Pages/Login Page/Login';


function App() {
  return (
    <>
      <Routes>
        <Route path="/CueInput" element={<CueInput />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/LiveCueSheet" element={<LiveCueSheet />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
