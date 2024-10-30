import React, { useState, useEffect } from "react";
import {
  fetchCheckInData,
  updateCheckInData,
  fetchAndDecryptWallet,
  updateUserBalance,
} from "../WalletManager";
import { useWallet } from "../WalletContext";
import Modal from "../telegram-components/Modal";
import "./DailyCheckIn.css";
import Footer from "../telegram-components/Footer";

const DailyCheckIn = ({
  coinBalance,
  gemBalance,
  setGemBalance,
  level,
  setLevel,
}) => {
  const { wallet, setExistingWallet } = useWallet();
  const [checkInDay, setCheckInDay] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reward, setReward] = useState(0);
  const [nextCheckInTime, setNextCheckInTime] = useState(null);
  const [passwordPrompted, setPasswordPrompted] = useState(false);
  const [modalMessage, setModalMessage] = useState(""); // State for modal message
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  const REWARD_PER_DAY = 10;
  const CHECK_IN_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds for testing
  const username = localStorage.getItem("username");

  useEffect(() => {
    const restoreWalletIfNeeded = async () => {
      if (!wallet && !passwordPrompted) {
        setPasswordPrompted(true);
        const password = window.prompt(
          "Please enter your password to restore your wallet:"
        );
        if (password) {
          const restoredWallet = await fetchAndDecryptWallet(
            username,
            password
          );
          if (restoredWallet) {
            setExistingWallet(restoredWallet);
          } else {
            setModalMessage("Failed to restore wallet. Please try again.");
            setIsModalOpen(true);
            return;
          }
        }
      }
    };

    const fetchUserData = async () => {
      if (!username || !wallet) return;

      const userData = await fetchCheckInData(username);

      if (userData) {
        const savedStreak = userData.streak || 0;
        const lastCheckInTime = userData.last_check_in_time;
        const now = new Date();

        if (lastCheckInTime) {
          const lastCheckInDate = new Date(lastCheckInTime);
          const timeDifference = now - lastCheckInDate;

          if (timeDifference < CHECK_IN_INTERVAL) {
            setStreak(savedStreak);
            setReward(savedStreak * REWARD_PER_DAY);
            setNextCheckInTime(CHECK_IN_INTERVAL - timeDifference);
            setCheckInDay(savedStreak % 7);
          } else if (timeDifference >= CHECK_IN_INTERVAL * 2) {
            setStreak(0);
            setReward(0);
            await updateCheckInData(username, 0, now.toISOString());
          } else {
            setStreak(0);
            setReward(0);
            setNextCheckInTime(0);
          }
        } else {
          setStreak(0);
          setReward(0);
          setNextCheckInTime(0);
        }
      }
    };

    const init = async () => {
      await restoreWalletIfNeeded();
      fetchUserData();
    };

    init();

    const countdown = setInterval(() => {
      if (nextCheckInTime > 0) {
        setNextCheckInTime((prev) => prev - 1000);
      }
    }, 1000);

    return () => clearInterval(countdown);
  }, [wallet, nextCheckInTime, passwordPrompted, setExistingWallet, username]);

  const handleCheckIn = async (day) => {
    if (nextCheckInTime > 0) {
      setModalMessage("You can only check in once every 24 hours.");
      setIsModalOpen(true);
      return;
    }

    const now = new Date();
    if (!username) {
      console.error("Username not found.");
      return;
    }

    // Calculate the new streak and reward
    const newStreak = streak + 1;
    const newReward = newStreak * REWARD_PER_DAY;
    setStreak(newStreak);
    setReward(newReward);
    setCheckInDay(day);

    // Update check-in data in Supabase
    await updateCheckInData(username, newStreak, now.toISOString());
    setNextCheckInTime(CHECK_IN_INTERVAL);

    // Update the user's gem balance in Supabase
    const newGemBalance = gemBalance + REWARD_PER_DAY;
    setGemBalance(newGemBalance);
    const totalPoints = coinBalance + newGemBalance;
    const newLevel = Math.floor(totalPoints / 1000) + 1; // Example level-up logic
    setLevel(newLevel);

    await updateUserBalance(username, coinBalance, newGemBalance, newLevel);

    // Set daily check-in completion in localStorage for Airdrop page
    localStorage.setItem(`dailyCheckInCompleted_${username}`, "true");
  };

  const formatTimeLeft = (time) => {
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const seconds = Math.floor((time / 1000) % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
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
            Day {index + 1} <br />+{REWARD_PER_DAY} Gems
          </div>
        ))}
      </div>

      <p>Current Streak: {streak} days</p>
      <p>Gems Earned: {reward}</p>

      {nextCheckInTime > 0 && (
        <p>Next Check-In: {formatTimeLeft(nextCheckInTime)}</p>
      )}

      {isModalOpen && (
        <Modal message={modalMessage} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default DailyCheckIn;
