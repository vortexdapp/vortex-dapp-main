import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

const App =
  process.env.REACT_APP_MODE === "telegram"
    ? require("./TelegramApp").default
    : require("./App").default;

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
