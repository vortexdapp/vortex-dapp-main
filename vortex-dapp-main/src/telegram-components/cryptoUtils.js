// cryptoUtils.js

// Encrypt data
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
      salt: enc.encode("random_salt"), // You can generate a proper salt
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

  return { encrypted, iv }; // Return both encrypted data and IV
}

// Decrypt data
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

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    derivedKey,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}
