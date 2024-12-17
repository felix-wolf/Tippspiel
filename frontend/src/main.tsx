import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import CacheProvider from "./contexts/CacheContext";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyByJTF5GgBPHklLFankEu8P7svIHyzKclk",
  authDomain: "biathlon-tippspiel.firebaseapp.com",
  projectId: "biathlon-tippspiel",
  storageBucket: "biathlon-tippspiel.firebasestorage.app",
  messagingSenderId: "1022459703871",
  appId: "1:1022459703871:web:94223e37fbae048caffe8a",
  measurementId: "G-GQN63HVN4Z",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const messaging = getMessaging(app);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CacheProvider>
      <App />
    </CacheProvider>
  </React.StrictMode>,
);
