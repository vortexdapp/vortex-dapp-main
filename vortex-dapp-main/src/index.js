import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

// Check URL parameter to decide which app to load
const isTelegramApp = window.location.search.includes("mode=telegram");

const MainApp = isTelegramApp
  ? require("./TelegramApp").default
  : require("./App").default;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);

reportWebVitals();
