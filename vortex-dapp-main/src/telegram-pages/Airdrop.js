import React, { useState, useEffect } from "react";
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
}) => {
  const navigate = useNavigate();
  const [twitterStatus, setTwitterStatus] = useState("Start");
  const [telegramStatus, setTelegramStatus] = useState("Start");
  const [likeStatus, setLikeStatus] = useState("Start");
  const [retweetStatus, setRetweetStatus] = useState("Start");
  const [dailyCheckinStatus, setDailyCheckinStatus] = useState("Start");
  const username = localStorage.getItem("username");

  useEffect(() => {
    // Check if daily check-in was completed by this specific user
    if (
      username &&
      localStorage.getItem(`dailyCheckInCompleted_${username}`) === "true"
    ) {
      setDailyCheckinStatus("Verified ✓");
    }
  }, [username]);

  const tasks = [
    {
      name: "Daily Check-In",
      reward: 50,
      status: dailyCheckinStatus,
      action: () => navigate("/daily-checkin"), // Always navigate to daily check-in page
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
    if (task === "twitter") {
      if (twitterStatus === "Start") {
        setTwitterStatus("Claim");
        window.open("https://twitter.com/vortexdapp", "_blank");
      } else if (twitterStatus === "Claim") {
        setTwitterStatus("Verified ✓");
        await increaseGemBalance(100);
      }
    } else if (task === "telegram") {
      if (telegramStatus === "Start") {
        setTelegramStatus("Claim");
        window.open("https://t.me/vortexdapp", "_blank");
      } else if (telegramStatus === "Claim") {
        setTelegramStatus("Verified ✓");
        await increaseGemBalance(100);
      }
    } else if (task === "like") {
      if (likeStatus === "Start") {
        setLikeStatus("Claim");
        window.open(
          "https://x.com/vortexdapp/status/1830638870607941851",
          "_blank"
        );
      } else if (likeStatus === "Claim") {
        setLikeStatus("Verified ✓");
        await increaseGemBalance(50);
      }
    } else if (task === "retweet") {
      if (retweetStatus === "Start") {
        setRetweetStatus("Claim");
        window.open(
          "https://x.com/vortexdapp/status/1830638870607941851",
          "_blank"
        );
      } else if (retweetStatus === "Claim") {
        setRetweetStatus("Verified ✓");
        await increaseGemBalance(50);
      }
    }
  };

  const increaseGemBalance = async (amount) => {
    const newGemBalance = gemBalance + amount;
    if (username) {
      setGemBalance(newGemBalance);

      const totalPoints = coinBalance + newGemBalance;
      const newLevel = Math.floor(totalPoints / 1000) + 1;
      setLevel(newLevel);

      // Update the balance in Supabase
      await updateUserBalance(username, coinBalance, newGemBalance, newLevel);
    }
  };

  return (
    <div className="settings">
      <WalletRestorer username={username} />
      <div className="airdrop">
        <h2>Airdrop Tasks</h2>
        <p>Complete tasks to earn rewards:</p>
        {tasks.map((task, index) => (
          <div key={index} className="task">
            <span>
              {task.name} +{task.reward}
              <img src={gemIcon} alt="Gems" className="gem-icon" />
            </span>
            <button onClick={task.action}>{task.status}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Airdrop;
