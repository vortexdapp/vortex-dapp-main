import crypto from "crypto";

export const validateTelegramData = (data) => {
  const botToken = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const { hash, ...otherData } = data;

  const checkString = Object.keys(otherData)
    .sort()
    .map((key) => `${key}=${otherData[key]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  return hmac === hash;
};
