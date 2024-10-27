// src/WalletManager.js
import { supabase } from "./supabaseClient";

// Encryption and Decryption Utility Functions
export async function encryptWallet(walletData, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("random_salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    derivedKey,
    enc.encode(walletData)
  );

  return {
    encrypted: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv),
  }; // Return both encrypted data and IV
}

export async function decryptWallet(encrypted, iv, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("random_salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const encryptedBuffer = new Uint8Array(encrypted).buffer; // Convert back to ArrayBuffer
  const ivBuffer = new Uint8Array(iv); // Use IV as Uint8Array

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    derivedKey,
    encryptedBuffer
  );

  return new TextDecoder().decode(decrypted);
}

// Function to create and store a wallet and return user_id
export async function createAndStoreWallet(username, walletData, password) {
  try {
    const { encrypted, iv } = await encryptWallet(
      JSON.stringify(walletData),
      password
    );

    // Insert the username, wallet data, and return the generated `user_id`
    const { data, error } = await supabase
      .from("wallets")
      .insert([
        {
          username,
          encrypted_wallet: JSON.stringify({ encrypted, iv }),
          coin_balance: 0, // Default 0 coins
          gem_balance: 50, // Default 50 gems
          level: 1,
        }, // Default level 1 },
      ])
      .select("user_id"); // Return the user_id from the inserted row

    if (error) {
      console.error("Error storing encrypted wallet:", error);
      return null;
    }

    return data[0].user_id; // Return the generated `user_id`
  } catch (error) {
    console.error("Error creating wallet:", error);
    return null;
  }
}

// Fetch and decrypt the wallet from Supabase by username
export async function fetchAndDecryptWallet(username, password) {
  try {
    // Retrieve the encrypted wallet from Supabase using the username
    const { data, error } = await supabase
      .from("wallets")
      .select("encrypted_wallet")
      .eq("username", username)
      .single();

    if (error || !data) {
      console.error("Error fetching wallet or wallet not found:", error);
      return null;
    }

    // Parse the encrypted data (including the IV)
    const { encrypted, iv } = JSON.parse(data.encrypted_wallet);

    // Decrypt the wallet using the user's password
    const decryptedWallet = await decryptWallet(encrypted, iv, password);

    if (decryptedWallet) {
      return JSON.parse(decryptedWallet); // Return parsed wallet data
    } else {
      console.error("Invalid password or decryption failed.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching or decrypting wallet:", error);
    return null;
  }
}

// Function to restore the wallet from localStorage and prompt for password if needed
export async function restoreWalletIfNeeded(wallet, setWallet, username) {
  if (!wallet && username) {
    const password = window.prompt(
      "Please enter your password to restore your wallet:"
    );
    if (password) {
      const restoredWallet = await fetchAndDecryptWallet(username, password);
      if (restoredWallet) {
        setWallet(restoredWallet);
        return true; // Successfully restored
      } else {
        alert("Failed to restore wallet. Please try again.");
        return false; // Failed to restore
      }
    }
  }
  return false; // No restoration needed
}

// Function to update user's check-in data
export async function updateCheckInData(username, streak, lastCheckInTime) {
  try {
    console.log(
      `Updating check-in for ${username}: streak=${streak}, time=${lastCheckInTime}`
    );

    const { data, error } = await supabase
      .from("wallets")
      .update({ streak, last_check_in_time: lastCheckInTime })
      .eq("username", username);

    console.log("Supabase response: ", { data, error });

    if (error) {
      console.error("Error updating check-in data:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating check-in data:", error);
    return false;
  }
}

// Function to fetch user check-in data using username
export async function fetchCheckInData(username) {
  try {
    const { data, error } = await supabase
      .from("wallets")
      .select("streak, last_check_in_time")
      .eq("username", username)
      .single();

    console.log("Fetched data from Supabase: ", { data, error });

    if (error) {
      console.error("Error fetching check-in data:", error);
      return null;
    }

    if (!data) {
      console.error("No data found for the provided username.");
      return null;
    }

    return data; // Return the fetched streak and last check-in time
  } catch (error) {
    console.error("Error fetching check-in data:", error);
    return null;
  }
}

export async function updateUserBalance(
  username,
  coinBalance,
  gemBalance,
  level
) {
  try {
    const { error } = await supabase
      .from("wallets")
      .update({
        coin_balance: coinBalance,
        gem_balance: gemBalance,
        level: level,
      })
      .eq("username", username);

    if (error) {
      console.error("Error updating balance in Supabase:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error updating balance:", error);
    return false;
  }
}

// Function to fetch user balance (coins, gems, and level)
export async function fetchUserBalance(username) {
  try {
    const { data, error } = await supabase
      .from("wallets")
      .select("coin_balance, gem_balance, level")
      .eq("username", username)
      .single();

    if (error || !data) {
      console.error("Error fetching user balance:", error);
      return null;
    }

    return data; // Return the fetched balance and level
  } catch (error) {
    console.error("Error fetching user balance:", error);
    return null;
  }
}
