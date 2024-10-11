// telegram-bot/index.js
require("dotenv").config();
const { Telegraf } = require("telegraf");
const { ethers } = require("ethers");

// Initialize Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize Ethereum Provider
const provider = new ethers.InfuraProvider(
  "sepolia",
  process.env.INFURA_PROJECT_ID
);

// Initialize Wallet
let wallet;
try {
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
} catch (error) {
  console.error("Error initializing wallet:", error.message);
  process.exit(1);
}

// Vortex Token Contract ABI
const VortexTokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  // Add other necessary function ABIs
];
const vortexToken = new ethers.Contract(
  process.env.VORTEX_TOKEN_ADDRESS,
  VortexTokenABI,
  wallet
);

// /start Command Handler
bot.start((ctx) => {
  ctx.reply("Welcome to Vortex! Let's get started.", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Vortex App",
            web_app: { url: `${process.env.WEB_APP_URL}` },
          },
        ],
      ],
    },
  });
});

/* // Handle web_app_data (optional)
bot.on("web_app_data", async (ctx) => {
  const data = JSON.parse(ctx.message.web_app_data.data);
  if (data.action === "createToken") {
    const { tokenAddress } = data;
    ctx.reply(
      `Your token has been created successfully! Address: ${tokenAddress}`
    );
  }
  // Handle other actions similarly
}); */

// Start the Bot
bot
  .launch()
  .then(() => {
    console.log("Telegram bot is running");
  })
  .catch((error) => {
    console.error("Error launching bot:", error);
    process.exit(1);
  });

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
