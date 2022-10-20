import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Homepage from './Homepage';
import Authentication from './Authentication';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from "react-router-dom"; // Functionality to redirect the user to different pages.
import TopBar from './TopBar';
import Profile from './Profile';
import { getDatapoint } from './PDM';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TopBar></TopBar>
    <BrowserRouter>
      <Routes> (//Routes to pages)
        <Route index element={<Homepage />} />
        <Route path="authentication" element={<Authentication />}/>
        <Route path="profile" element={<Profile />}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
