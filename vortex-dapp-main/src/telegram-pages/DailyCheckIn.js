import React, { useState, useEffect } from "react";
import {
  fetchCheckInData,
  updateCheckInData,
  fetchAndDecryptWallet,
} from "../WalletManager"; // Adjust path as needed
import { useWallet } from "../WalletContext";
import "./DailyCheckIn.css";
import Footer from "../telegram-components/Footer";

const DailyCheckIn = () => {
  const { wallet, setExistingWallet } = useWallet(); // Access and set the connected wallet
  const [checkInDay, setCheckInDay] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reward, setReward] = useState(0);
  const [nextCheckInTime, setNextCheckInTime] = useState(null);
  const [passwordPrompted, setPasswordPrompted] = useState(false);

  const REWARD_PER_DAY = 10; // Amount of gems for each day
  const CHECK_IN_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const username = localStorage.getItem("username");

  useEffect(() => {
    const restoreWalletIfNeeded = async () => {
      if (!wallet && !passwordPrompted) {
        // Prompt for the password only once
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
            alert("Failed to restore wallet. Please try again.");
            return;
          }
        }
      }
    };

    const fetchUserData = async () => {
      if (!username || !wallet) return;

      // Fetch the user's check-in data from Supabase
      const userData = await fetchCheckInData(username);

      if (userData) {
        const savedStreak = userData.streak || 0;
        const lastCheckInTime = userData.last_check_in_time;

        setStreak(savedStreak);
        setReward(savedStreak * REWARD_PER_DAY);

        if (lastCheckInTime) {
          const lastCheckInDate = new Date(lastCheckInTime);
          const now = new Date();
          const timeDifference = now - lastCheckInDate;

          if (timeDifference < CHECK_IN_INTERVAL) {
            const timeLeft = CHECK_IN_INTERVAL - timeDifference;
            setNextCheckInTime(timeLeft);

            // Set the check-in day based on the streak
            setCheckInDay(savedStreak % 7); // Assuming 7 days for the week
          } else {
            // If 24 hours have passed, allow the user to check in again
            setNextCheckInTime(0);
          }
        } else {
          // If no last check-in time, allow user to check in
          setNextCheckInTime(0);
        }
      }
    };

    // Only restore the wallet if needed and fetch data afterward
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
      alert("You can only check in once every 24 hours.");
      return;
    }

    const now = new Date();

    if (!username) {
      console.error("Username not found.");
      return;
    }

    // Update streak and reward
    const newStreak = streak + 1;
    setStreak(newStreak);
    setReward(newStreak * REWARD_PER_DAY);
    setCheckInDay(day);

    await updateCheckInData(username, newStreak, now.toISOString()); // Update in Supabase

    // Set the countdown for the next check-in
    setNextCheckInTime(CHECK_IN_INTERVAL);
  };

  const formatTimeLeft = (time) => {
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const seconds = Math.floor((time / 1000) % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="settings">
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
    </div>
  );
};

export default DailyCheckIn;
