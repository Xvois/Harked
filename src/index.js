import React from 'react';
import ReactDOM from 'react-dom/client';
import './CSS/output.css';
import './CSS/globals.css'
import TopBar from "./TopBar";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Analytics} from "@vercel/analytics/react";
import PlaylistView from "./PlaylistView";
import Feed from "./Feed";
import {Settings} from "./Settings";
import Followers from "./Followers";
import Comparison from "./Comparison";
import Authentication from "./Authentication/Authentication";
import Homepage from "./Homepage";
import reportWebVitals from "./reportWebVitals";
import {Profile} from "@/Pages/Profile/Profile";
import {Toaster} from "@/Components/ui/toaster";

const htmlElement = document.documentElement;

window.addEventListener('load', () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    htmlElement.classList.add('dark');
  }
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  const newColorScheme = e.matches ? "dark" : "light";

  if (newColorScheme === 'dark') {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }
});

const rootElement = document.getElementById('root');

const root = ReactDOM.createRoot(rootElement);

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
            </Routes>
        </BrowserRouter>
        <Toaster/>
        <Analytics/>
    </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
