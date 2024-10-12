// telegram-web-app/src/telegram-pages/DailyCheckIn.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./DailyCheckIn.css";

const DailyCheckIn = () => {
  const [checkInDay, setCheckInDay] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reward, setReward] = useState(0);

  // Reset progress if the user misses a day (simulate by clearing localStorage)
  useEffect(() => {
    const savedStreak = parseInt(localStorage.getItem("streak"), 10) || 0;
    setStreak(savedStreak);
    setReward(savedStreak * 10); // e.g., 10 gems per day in the streak
  }, []);

  const handleCheckIn = (day) => {
    if (day === checkInDay + 1) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setReward(newStreak * 10); // Example: reward increases with each consecutive day
      setCheckInDay(day);
      localStorage.setItem("streak", newStreak);
    } else {
      // Missed a day, reset the streak
      setStreak(1);
      setReward(10);
      setCheckInDay(1);
      localStorage.setItem("streak", 1);
    }
  };

  return (
    <div className="daily-checkin">
      <h2>Daily Check-In</h2>
      <p>
        Check in each day to earn more gems. Miss a day and your progress
        resets!
      </p>

      <div className="week-container">
        {[...Array(7)].map((_, index) => (
          <div
            key={index}
            className={`day-box ${index < checkInDay ? "checked" : ""}`}
            onClick={() => handleCheckIn(index + 1)}
          >
            Day {index + 1}
          </div>
        ))}
      </div>

      <p>Current Streak: {streak} days</p>
      <p>Gems Earned: {reward}</p>

      <div className="footer-menu">
        <Link to="/launch" className="menu-item">
          Launch
        </Link>
        <Link to="/stake" className="menu-item">
          Stake
        </Link>
        <Link to="/trade" className="menu-item">
          Trade
        </Link>
        <Link to="/airdrop" className="menu-item">
          Airdrop
        </Link>
      </div>
    </div>
  );
};

export default DailyCheckIn;
