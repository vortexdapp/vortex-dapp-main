const axios = require("axios");

async function fetchTokenHolders(contractAddress, apiKey) {
  const url = `https://api.bscscan.com/api?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=1000&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "1") {
      return response.data.result;
    } else {
      console.error("Failed to fetch holders:", response.data.result);
      return [];
    }
  } catch (error) {
    console.error("Error fetching token holders:", error);
    return [];
  }
}

// Example usage
const apiKey = "A9ESUJ62PS5A5EVKWEA88RCUHS3I2C7BUB";
const contractAddress = "0xE3Bb1E884Ee24aA5f0E399416da698Da43a2a476";
fetchTokenHolders(contractAddress, apiKey).then((holders) => {
  console.log(holders);
});
