import { useState } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../main.tsx";

export default function Debug() {
  const [debugInfoText, setDebugInfoText] = useState("");

  function onClickPermission() {
    console.log("Requesting permission...");
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted.");
        setDebugInfoText("Notification permission granted.");
      } else {
        console.log("Notification permission denied.");
        setDebugInfoText("Notification permission denied.");
      }
    });
  }

  function requestToken(
    serviceWorkerRegistration: ServiceWorkerRegistration | undefined,
  ) {
    console.log("Requesting permission...");
    getToken(messaging, {
      vapidKey:
        "BJrEvjNP4CKHuxmUsvLIQnCTD2TveRozjOgxfyESQonaZJfMcChWX67OFlJivbiqCD9Z2bIvgFQvLeUnT12zcZE",
      serviceWorkerRegistration: serviceWorkerRegistration,
    })
      .then((currentToken) => {
        if (currentToken) {
          console.log("Current Token:", currentToken);
          setDebugInfoText("Current Token: " + currentToken);
          // Send the token to your server and update the UI if necessary
          // ...
        } else {
          // Show permission request UI
          console.log(
            "No registration token available. Request permission to generate one.",
          );
          setDebugInfoText(
            "No registration token available. Request permission to generate one.",
          );
          // ...
        }
      })
      .catch((err) => {
        console.log("An error occurred while retrieving token. ", err);
        setDebugInfoText(
          "An error occurred while retrieving token:" + err.toString(),
        );
        // ...
      });
  }

  if ("serviceWorker" in navigator) {
    console.log("load");
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          requestToken(registration);
          console.log(
            "Service Worker registered with scope:",
            registration.scope,
          );
          setDebugInfoText(
            "Service Worker registered with scope: " +
              registration.scope.toString(),
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
          setDebugInfoText(
            "Service Worker registration failed: " + error.toString(),
          );
        });
    });
  } else {
    console.log("serviceWorker not in navigator");
    setDebugInfoText("serviceWorker not in navigator");
  }

  return (
    <div>
      <h1 style={{ fontSize: 40 }}>Debug</h1>
      <div onClick={() => onClickPermission()}>Request Permission</div>
      <div onClick={() => requestToken(undefined)}>Request Token</div>
      <div style={{ margin: 40 }}>{debugInfoText}</div>
    </div>
  );
}
