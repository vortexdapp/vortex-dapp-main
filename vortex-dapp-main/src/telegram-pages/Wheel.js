import React, { useState } from "react";
import { updateUserBalance } from "../WalletManager";
import "./Wheel.css";

const Wheel = ({
  coinBalance,
  setCoinBalance,
  gemBalance,
  setGemBalance,
  setLevel,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(""); // Prize won by the user

  // Possible prizes
  const prizes = [
    { reward: "100 Gems", color: "#ff6f61", type: "gems", amount: 100 },
    { reward: "200 Gems", color: "#4a90e2", type: "gems", amount: 200 },
    { reward: "300 Gems", color: "#50d2c2", type: "gems", amount: 300 },
    { reward: "500 Coins", color: "#f7b733", type: "coins", amount: 500 },
    { reward: "1000 Coins", color: "#7ed321", type: "coins", amount: 1000 },
    { reward: "1 Extra Spin", color: "#d0021b", type: "extra", amount: 1 },
  ];

  const numSegments = prizes.length;
  const segmentAngle = 360 / numSegments;
  const username = localStorage.getItem("username");

  const spinWheel = () => {
    if (spinning) return; // Prevent multiple clicks while spinning
    setSpinning(true);
    setPrize(""); // Reset prize before spinning

    // Generate a random spin degree between 5000 and 7000 degrees for a good long spin
    const randomDegree = Math.floor(Math.random() * 2000) + 5000;

    // This ensures the spinning stops at a segment boundary (+1 to avoid boundary issues)
    const extraDegrees = randomDegree % 360;
    const adjustment = 360 - extraDegrees + segmentAngle / 2;

    const finalRotation = randomDegree + adjustment; // Adjust so the segment stops at the top

    const wheel = document.getElementById("wheel");
    wheel.style.transition = "transform 5s ease-out";
    wheel.style.transform = `rotate(${finalRotation}deg)`;

    setTimeout(() => {
      // Compute which segment is at the top
      const effectiveDegrees = finalRotation % 360; // Normalize rotation
      const segmentIndex = Math.floor(
        (effectiveDegrees / segmentAngle) % numSegments
      );
      const selectedPrize = prizes[segmentIndex];

      setPrize(selectedPrize.reward); // Set the prize won

      // Update balance based on prize
      if (selectedPrize.type === "coins") {
        const newCoinBalance = coinBalance + selectedPrize.amount;
        setCoinBalance(newCoinBalance);
        updateUserBalance(username, newCoinBalance, gemBalance, "coins");
      } else if (selectedPrize.type === "gems") {
        const newGemBalance = gemBalance + selectedPrize.amount;
        setGemBalance(newGemBalance);
        updateUserBalance(username, coinBalance, newGemBalance, "gems");
      }

      setSpinning(false); // Allow spinning again
    }, 5000); // 5-second spin duration
  };

  return (
    <div className="wheel-container">
      <h2>Spin the Wheel</h2>
      <div className="wheel-wrapper">
        {/* Arrow indicating the selected segment */}
        <div className="arrow"></div>
        {/* Wheel */}
        <div id="wheel" className="wheel">
          {prizes.map((prize, index) => (
            <div
              key={index}
              className="wheel-segment"
              style={{
                transform: `rotate(${index * segmentAngle}deg)`,
                backgroundColor: prize.color,
              }}
            >
              <div className="segment-content">
                <span className="segment-text">{prize.reward}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        id="spin-button"
        className="spin-button"
        onClick={spinWheel}
        disabled={spinning}
      >
        {spinning ? "Spinning..." : "Spin"}
      </button>
      {prize && <p className="prize-announcement">You won: {prize}!</p>}
    </div>
  );
};

export default Wheel;
