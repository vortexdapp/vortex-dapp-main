import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { updateUserBalance } from "../WalletManager";
import { Chart, ArcElement, Tooltip } from "chart.js";
import "./Wheel.css";
import { supabase } from "../supabaseClient"; // Supabase client setup

Chart.register(ArcElement, Tooltip);

const drawSegmentLabels = {
  id: "drawSegmentLabels",
  afterDatasetDraw(chart) {
    const {
      ctx,
      data,
      chartArea: { width, height },
    } = chart;
    ctx.save();
    const fontSize = 14;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const anglePerSegment = (2 * Math.PI) / data.labels.length;
    const radius = (width / 2) * 0.7;

    data.labels.forEach((label, index) => {
      const angle = anglePerSegment * index - Math.PI / 2 + anglePerSegment / 2;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, radius, 0);
      ctx.restore();
    });
    ctx.restore();
  },
};

Chart.register(drawSegmentLabels);

const MAX_SPINS = 3;

const Wheel = ({
  coinBalance,
  setCoinBalance,
  gemBalance,
  setGemBalance,
  setLevel,
}) => {
  const [spinsLeft, setSpinsLeft] = useState(MAX_SPINS);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState("");
  const [rotation, setRotation] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const username = localStorage.getItem("username");

  const prizes = [
    { label: "100 Gems", type: "gems", amount: 100, color: "#ff6f61" },
    { label: "200 Gems", type: "gems", amount: 200, color: "#4a90e2" },
    { label: "300 Gems", type: "gems", amount: 300, color: "#50d2c2" },
    { label: "500 Coins", type: "coins", amount: 500, color: "#f7b733" },
    { label: "1000 Coins", type: "coins", amount: 1000, color: "#7ed321" },
    { label: "1 Extra Spin", type: "extra", amount: 1, color: "#d0021b" },
    { label: "2000 Coins", type: "coins", amount: 2000, color: "#7ed321" },
    { label: "3 Extra Spin", type: "extra", amount: 3, color: "#d0021b" },
  ];

  const numSegments = prizes.length;
  const segmentAngle = 360 / numSegments;

  useEffect(() => {
    const fetchSpins = async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("spins_left, last_spin_date")
        .eq("username", username)
        .single();

      if (error) {
        console.error("Error fetching spins:", error);
      } else {
        const today = new Date().toDateString();
        if (data.last_spin_date !== today) {
          setSpinsLeft(MAX_SPINS);
          await supabase
            .from("wallets")
            .update({ spins_left: MAX_SPINS, last_spin_date: today })
            .eq("username", username);
        } else {
          setSpinsLeft(data.spins_left);
        }
      }
    };

    fetchSpins();
  }, [username]);

  // Countdown Timer for Daily Reset
  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Set to midnight of the next day
      const timeDiff = midnight - now;

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeUntilMidnight();
    const interval = setInterval(calculateTimeUntilMidnight, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSpinReward = async (extraSpins) => {
    const newSpinsLeft = spinsLeft + extraSpins;
    setSpinsLeft(newSpinsLeft);
    await supabase
      .from("wallets")
      .update({ spins_left: newSpinsLeft })
      .eq("username", username);
  };

  const spinWheel = async () => {
    if (spinning || spinsLeft <= 0) return;
    setSpinning(true);
    setPrize("");

    // Decrement spins and update the database
    const newSpinsLeft = spinsLeft - 1;
    setSpinsLeft(newSpinsLeft);
    await supabase
      .from("wallets")
      .update({ spins_left: newSpinsLeft })
      .eq("username", username);

    const randomSegment = Math.floor(Math.random() * numSegments);
    const endRotation =
      360 * 5 + randomSegment * segmentAngle - segmentAngle / 2;

    setRotation(endRotation);

    setTimeout(async () => {
      setSpinning(false);
      const totalPoints = coinBalance + gemBalance;
      const newLevel = Math.floor(totalPoints / 1000) + 1;
      setLevel(newLevel);
      const normalizedAngle = endRotation % 360;
      const winningSegmentIndex = Math.floor(
        (numSegments - normalizedAngle / segmentAngle) % numSegments
      );
      const selectedPrize = prizes[winningSegmentIndex];
      setPrize(selectedPrize.label);

      if (selectedPrize.type === "coins") {
        const newCoinBalance = coinBalance + selectedPrize.amount;
        setCoinBalance(newCoinBalance);
        updateUserBalance(username, newCoinBalance, gemBalance, newLevel);
      } else if (selectedPrize.type === "gems") {
        const newGemBalance = gemBalance + selectedPrize.amount;
        setGemBalance(newGemBalance);
        updateUserBalance(username, coinBalance, newGemBalance, newLevel);
      } else if (selectedPrize.type === "extra") {
        await handleSpinReward(selectedPrize.amount);
      }
    }, 5000); // Spin duration in ms
  };

  const data = {
    labels: prizes.map((prize) => prize.label),
    datasets: [
      {
        data: prizes.map(() => 1),
        backgroundColor: prizes.map((prize) => prize.color),
        borderWidth: 0,
        borderAlign: "inner",
      },
    ],
  };

  const options = {
    rotation: 0,
    circumference: 360,
    cutout: "0%",
    plugins: {
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <div className="wheel-page">
      <div className="wheel-container">
        <div className="arrow"></div>
        <div
          className="wheel-wrapper"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: "transform 5s cubic-bezier(0.33, 1, 0.68, 1)",
          }}
        >
          <Doughnut data={data} options={options} />
        </div>
        <button
          id="spin-button"
          className="spin-button"
          onClick={spinWheel}
          disabled={spinning || spinsLeft <= 0}
        >
          {spinning ? "Spinning..." : spinsLeft > 0 ? "Spin" : "No Spins Left"}
        </button>
        <p>Spins left today: {spinsLeft}</p>
        {spinsLeft === 0 && <p>Next spin in: {timeUntilReset}</p>}
        {prize && <p className="prize-announcement">You won: {prize}!</p>}
      </div>
    </div>
  );
};

export default Wheel;
