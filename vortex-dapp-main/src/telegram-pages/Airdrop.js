// telegram-web-app/src/telegram-pages/Airdrop.js
import React, { useState } from "react";
import "./Airdrop.css";
import { Link, useNavigate } from "react-router-dom";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";
import Header from "../telegram-components/Header";
import Footer from "../telegram-components/Footer";

const baseLevelUpThreshold = 1000;
const calculateLevelUpThreshold = (level) => baseLevelUpThreshold * level;

const Airdrop = () => {
  const navigate = useNavigate();
  const [twitterStatus, setTwitterStatus] = useState("Start");
  const [telegramStatus, setTelegramStatus] = useState("Start");
  const [likeStatus, setLikeStatus] = useState("Start");
  const [retweetStatus, setRetweetStatus] = useState("Start");
  const [dailyCheckinStatus, setDailyCheckinStatus] = useState("Start");
  const [gemBalance, setGemBalance] = useState(250);
  const [coinBalance, setCoinBalance] = useState(1000);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;

  const tasks = [
    {
      name: "Daily Check-In",
      reward: 50,
      status: dailyCheckinStatus,
      action: () => handleTaskClick("dailyCheckin"),
    },
    {
      name: "Follow us on Twitter",
      reward: 100,
      status: twitterStatus,
      action: () => handleTaskClick("twitter"),
    },
    {
      name: "Join our Telegram group",
      reward: 2500000,
      status: telegramStatus,
      action: () => handleTaskClick("telegram"),
    },
    {
      name: "Like our tweet",
      reward: 5000,
      status: likeStatus,
      action: () => handleTaskClick("like"),
    },
    {
      name: "Retweet our tweet",
      reward: 3000,
      status: retweetStatus,
      action: () => handleTaskClick("retweet"),
    },
  ];

  const handleTaskClick = (task) => {
    if (task === "dailyCheckin" && dailyCheckinStatus === "Start") {
      setDailyCheckinStatus("Claim");
      navigate("/daily-checkin");
    } else if (task === "dailyCheckin" && dailyCheckinStatus === "Claim") {
      setDailyCheckinStatus("Verified ✓");
      increaseGemBalance(50);
    }

    if (task === "twitter" && twitterStatus === "Start") {
      setTwitterStatus("Claim");
      window.open("https://twitter.com/vortexdapp", "_blank");
    } else if (task === "twitter" && twitterStatus === "Claim") {
      setTwitterStatus("Verified ✓");
      increaseGemBalance(100);
    }

    if (task === "telegram" && telegramStatus === "Start") {
      setTelegramStatus("Claim");
      window.open("https://t.me/vortexdapp", "_blank");
    } else if (task === "telegram" && telegramStatus === "Claim") {
      setTelegramStatus("Verified ✓");
      increaseGemBalance(100);
    }

    if (task === "like" && likeStatus === "Start") {
      setLikeStatus("Claim");
      window.open(
        "https://x.com/vortexdapp/status/1830638870607941851",
        "_blank"
      );
    } else if (task === "like" && likeStatus === "Claim") {
      setLikeStatus("Verified ✓");
      increaseGemBalance(100);
    }

    if (task === "retweet" && retweetStatus === "Start") {
      setRetweetStatus("Claim");
      window.open(
        "https://x.com/vortexdapp/status/1830638870607941851",
        "_blank"
      );
    } else if (task === "retweet" && retweetStatus === "Claim") {
      setRetweetStatus("Verified ✓");
      increaseGemBalance(100);
    }
  };

  const increaseGemBalance = (amount) => {
    const newGemBalance = gemBalance + amount;
    setGemBalance(newGemBalance);

    const totalPoints = coinBalance + newGemBalance;
    const newLevel = Math.floor(totalPoints / levelUpThreshold) + 1;
    setLevel(newLevel);
  };

  const progress =
    (((coinBalance + gemBalance) % levelUpThreshold) / levelUpThreshold) * 100;

  return (
    <div className="settings">
      <Header coinBalance={coinBalance} gemBalance={gemBalance} level={level} />

      <div className="airdrop">
        <h2>Airdrop Tasks</h2>
        <p>Complete tasks to earn rewards:</p>
        {tasks.map((task, index) => (
          <div key={index} className="task">
            <span>
              {" "}
              {task.name} {"+"} {task.reward}
              <img src={gemIcon} alt="Gems" className="gem-icon" />
            </span>
            <button
              onClick={task.action}
              disabled={task.status === "Verified ✓"}
            >
              {task.status}
            </button>
          </div>
        ))}
      </div>

      {/* Footer Menu */}
      <Footer />
    </div>
  );
};

export default Airdrop;
