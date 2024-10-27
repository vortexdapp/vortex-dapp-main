import React, { useState } from "react";
import "./Airdrop.css";
import { useNavigate } from "react-router-dom";
import { updateUserBalance } from "../WalletManager";
import gemIcon from "../assets/gem.png";
import WalletRestorer from "../telegram-components/WalletRestorer";

const Airdrop = ({
  coinBalance,
  gemBalance,
  level,
  setGemBalance,
  setCoinBalance,
  setLevel,
  onBalanceUpdate,
}) => {
  const navigate = useNavigate();
  const [twitterStatus, setTwitterStatus] = useState("Start");
  const [telegramStatus, setTelegramStatus] = useState("Start");
  const [likeStatus, setLikeStatus] = useState("Start");
  const [retweetStatus, setRetweetStatus] = useState("Start");
  const [dailyCheckinStatus, setDailyCheckinStatus] = useState("Start");
  const username = localStorage.getItem("username");

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
      reward: 100,
      status: telegramStatus,
      action: () => handleTaskClick("telegram"),
    },
    {
      name: "Like our tweet",
      reward: 50,
      status: likeStatus,
      action: () => handleTaskClick("like"),
    },
    {
      name: "Retweet our tweet",
      reward: 50,
      status: retweetStatus,
      action: () => handleTaskClick("retweet"),
    },
  ];

  const handleTaskClick = async (task) => {
    if (task === "dailyCheckin" && dailyCheckinStatus === "Start") {
      setDailyCheckinStatus("Claim");
      navigate("/daily-checkin");
    } else if (task === "dailyCheckin" && dailyCheckinStatus === "Claim") {
      setDailyCheckinStatus("Verified ✓");
      await increaseGemBalance(50);
    }

    if (task === "twitter" && twitterStatus === "Start") {
      setTwitterStatus("Claim");
      window.open("https://twitter.com/vortexdapp", "_blank");
    } else if (task === "twitter" && twitterStatus === "Claim") {
      setTwitterStatus("Verified ✓");
      await increaseGemBalance(100);
    }

    if (task === "telegram" && telegramStatus === "Start") {
      setTelegramStatus("Claim");
      window.open("https://t.me/vortexdapp", "_blank");
    } else if (task === "telegram" && telegramStatus === "Claim") {
      setTelegramStatus("Verified ✓");
      await increaseGemBalance(100);
    }

    if (task === "like" && likeStatus === "Start") {
      setLikeStatus("Claim");
      window.open(
        "https://x.com/vortexdapp/status/1830638870607941851",
        "_blank"
      );
    } else if (task === "like" && likeStatus === "Claim") {
      setLikeStatus("Verified ✓");
      await increaseGemBalance(50);
    }

    if (task === "retweet" && retweetStatus === "Start") {
      setRetweetStatus("Claim");
      window.open(
        "https://x.com/vortexdapp/status/1830638870607941851",
        "_blank"
      );
    } else if (task === "retweet" && retweetStatus === "Claim") {
      setRetweetStatus("Verified ✓");
      await increaseGemBalance(50);
    }
  };

  const increaseGemBalance = async (amount) => {
    const newGemBalance = gemBalance + amount;
    const username = localStorage.getItem("username"); // Assuming username is stored in local storage

    if (username) {
      // Update state immediately
      setGemBalance(newGemBalance);

      const totalPoints = coinBalance + newGemBalance;
      const newLevel = Math.floor(totalPoints / 1000) + 1; // Example level-up logic
      setLevel(newLevel);

      // Call the function to update the balance in Supabase
      await updateUserBalance(username, coinBalance, newGemBalance, newLevel);
    }
  };

  return (
    <div className="settings">
      <WalletRestorer username={username} />{" "}
      <div className="airdrop">
        <h2>Airdrop Tasks</h2>
        <p>Complete tasks to earn rewards:</p>
        {tasks.map((task, index) => (
          <div key={index} className="task">
            <span>
              {task.name} +{task.reward}
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
    </div>
  );
};

export default Airdrop;
