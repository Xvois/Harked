import React from 'react';
import ReactDOM from 'react-dom/client';
import './CSS/index.css';
import TopBar from "./TopBar";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Analytics} from "@vercel/analytics/react";
import Review from "./Review";
import Reviews from "./Reviews";
import PlaylistView from "./PlaylistView";
import Feed from "./Feed";
import {Settings} from "./Settings";
import Followers from "./Followers";
import Comparison from "./Comparison";
import Authentication from "./Authentication/Authentication";
import Homepage from "./Homepage";
import reportWebVitals from "./reportWebVitals";
import {Profile} from "@/Pages/Profile/Profile";

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
                <Route path="/review/:id" element={<Review />}/>
            </Routes>
        </BrowserRouter>
        <Analytics/>
    </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
