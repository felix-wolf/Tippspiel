import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import CacheProvider from "./contexts/CacheContext";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
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

function requestPermission() {
  console.log("Requesting permission...");
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("Notification permission granted.");
    }
  });
}
requestPermission();
// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.
getToken(messaging, {
  vapidKey:
    "BJrEvjNP4CKHuxmUsvLIQnCTD2TveRozjOgxfyESQonaZJfMcChWX67OFlJivbiqCD9Z2bIvgFQvLeUnT12zcZE",
})
  .then((currentToken) => {
    if (currentToken) {
      console.log("Current Token:", currentToken);
      // Send the token to your server and update the UI if necessary
      // ...
    } else {
      // Show permission request UI
      console.log(
        "No registration token available. Request permission to generate one.",
      );
      // ...
    }
  })
  .catch((err) => {
    console.log("An error occurred while retrieving token. ", err);
    // ...
  });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CacheProvider>
      <App />
    </CacheProvider>
  </React.StrictMode>,
);

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope,
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
