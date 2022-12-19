import React from 'react';
import ReactDOM from 'react-dom/client';
import './CSS/index.css';
import Homepage from './JS/Homepage';
import Authentication from './JS/Authentication';
import Comparison from './JS/Comparison'
import reportWebVitals from './JS/reportWebVitals';
import Feedback from "./JS/Feedback";
import { BrowserRouter, Route, Routes } from "react-router-dom"; // Functionality to redirect the user to different pages.
import TopBar from './JS/TopBar';
import Profile from './JS/Profile';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TopBar></TopBar>
    <BrowserRouter>
      <Routes> (//Routes to pages)
        <Route index element={<Homepage />} />
        <Route path="authentication" element={<Authentication />}/>
        <Route path="profile" element={<Profile />}/>
          <Route path="compare" element={<Comparison />}/>
          <Route path="feedback" element={<Feedback />}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
