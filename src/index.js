import React from 'react';
import ReactDOM from 'react-dom/client';
import './CSS/index.css';
import Homepage from './JS/Homepage';
import Authentication from './JS/Authentication';
import Comparison from './JS/Comparison'
import reportWebVitals from './JS/reportWebVitals';
import {BrowserRouter, Route, Routes} from "react-router-dom"; // Functionality to redirect the user to different pages.
import TopBar from './JS/TopBar';
import Profile from './JS/Profile';
import {Analytics} from '@vercel/analytics/react';
import {Settings} from './JS/Settings.tsx'
import Followers from "./JS/Followers";
import Feed from "./JS/Feed.tsx";
import PlaylistView from "./JS/PlaylistView.tsx";
import Reviews from "./JS/Reviews.tsx";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <>
        <TopBar/>
        <BrowserRouter>
            <Routes> (//Routes to pages)
                <Route index element={<Homepage/>}/>
                <Route path="/authentication" element={<Authentication/>}/>
                <Route path="/profile/:id" element={<Profile/>}/>
                <Route path="/compare" element={<Comparison/>}/>
                <Route path="/followers" element={<Followers/>}/>
                <Route path="/settings" element={<Settings/>}/>
                <Route path="/feed" element={<Feed/>}/>
                <Route path="/playlist/:id" element={<PlaylistView/>}/>
                <Route path="/reviews/:id" element={<Reviews/>}/>
            </Routes>
        </BrowserRouter>
        <Analytics/>
    </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
