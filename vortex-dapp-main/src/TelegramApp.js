// telegram-web-app/src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "../src/telegram-pages/Dashboard";
import Launch from "../src/telegram-pages/Launch";
import Stake from "../src/telegram-pages/Stake";
import Trade from "../src/telegram-pages/Trade";
import Header from "../src/telegram-pages/Header";
import StartPage from "../src/telegram-pages/Start";
import "./TelegramApp.css";

const TelegramApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/launch" element={<Launch />} />
        <Route path="/stake" element={<Stake />} />
        <Route path="/trade" element={<Trade />} />
      </Routes>
    </Router>
  );
};

export default TelegramApp;
