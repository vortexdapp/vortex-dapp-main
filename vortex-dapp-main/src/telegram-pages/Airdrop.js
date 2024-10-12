// telegram-web-app/src/telegram-pages/Airdrop.js
import React, { useState } from "react";
import "./Airdrop.css";
import { Link } from "react-router-dom";

const Airdrop = () => {
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [telegramVerified, setTelegramVerified] = useState(false);

  const handleTwitterVerify = () => setTwitterVerified(true);
  const handleTelegramVerify = () => setTelegramVerified(true);

  return (
    <div className="background-img">
      <div className="airdrop">
        <h2>Airdrop Tasks</h2>
        <p>Complete tasks to earn gems:</p>

        <Link to="/daily-checkin" className="task">
          <span>Daily Check-In</span>
          <button>Go to Check-In</button>
        </Link>

        <a
          href="https://twitter.com/vortexdapp"
          target="_blank"
          rel="noopener noreferrer"
          className="task"
          onClick={handleTwitterVerify}
        >
          <span>Follow us on Twitter</span>
          <button disabled={twitterVerified}>
            {twitterVerified ? "Verified ✓" : "Verify"}
          </button>
        </a>

        <a
          href="https://t.me/vortexdapp"
          target="_blank"
          rel="noopener noreferrer"
          className="task"
          onClick={handleTelegramVerify}
        >
          <span>Join our Telegram group</span>
          <button disabled={telegramVerified}>
            {telegramVerified ? "Verified ✓" : "Verify"}
          </button>
        </a>
      </div>

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

export default Airdrop;
