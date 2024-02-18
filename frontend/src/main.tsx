import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import CacheProvider from "./contexts/CacheContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CacheProvider>
      <App />
    </CacheProvider>
  </React.StrictMode>,
);
