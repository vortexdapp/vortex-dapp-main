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

// Create and store an encrypted wallet in Supabase with a username
export async function createAndStoreWallet(username, walletData, password) {
  try {
    const { encrypted, iv } = await encryptWallet(
      JSON.stringify(walletData),
      password
    );

    // Insert the username and encrypted wallet data into Supabase
    const { error } = await supabase
      .from("wallets")
      .insert([
        { username, encrypted_wallet: JSON.stringify({ encrypted, iv }) },
      ]);

    if (error) {
      console.error("Error storing encrypted wallet:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error creating wallet:", error);
    return false;
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
