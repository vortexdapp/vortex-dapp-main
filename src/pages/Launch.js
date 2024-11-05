// CombinedFactoryDashboard.js

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";
import MyTokenJson from "../contracts/MyToken.json";
import "./FactoryPage.css";
import { useCustomWeb3Modal } from "../Web3ModalContext";
import { Link } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { firestore } from "../components/firebaseConfig.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
/* global BigInt */

const networkConfig = {
  // Example Chain IDs for Base and Sepolia
  8453: {
    factoryAddress: "0xF686e6CAF7d823E4130339E6f2b02C37836fE90F",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://base.blockscout.com/",
  },
  11155111: {
    factoryAddress: "0x0CeD474F344497dc917D285a00eEE0394c6F044c",
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://eth-sepolia.blockscout.com/",
  },
  // Add other network configurations...
};

const CHAIN_NAMES = {
  56: "BSC",
  42161: "Arbitrum",
  8453: "Base",
  11155111: "Sepolia",
  10: "Optimism",
  42220: "Celo",
};

const IMGUR_API_URL = "https://api.imgur.com/3/image";
const CLIENT_ID = "7bd162baabe49a2";

const uploadImageToImgur = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(IMGUR_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${CLIENT_ID}`,
        Accept: "application/json",
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      console.log("Image uploaded to Imgur:", data.data.link);
      return data.data.link;
    } else {
      throw new Error("Failed to upload image to Imgur");
    }
  } catch (error) {
    console.error("Error uploading image to Imgur:", error);
    return null;
  }
};

function CombinedFactoryDashboard() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [tokenImage, setTokenImage] = useState(null);
  const [tokenImageUrl, setTokenImageUrl] = useState(null);
  const [deployedContractAddress, setDeployedContractAddress] = useState("");
  const [tokenDetails, setTokenDetails] = useState({
    name: "",
    symbol: "",
    supply: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [tokenAmountToBuy, setTokenAmountToBuy] = useState("0.000005");

  // Use the custom Web3Modal context
  const {
    address: connectedWallet,
    chainId,
    isConnected,
    connect,
    disconnect,
  } = useCustomWeb3Modal();

  const explorerUrl =
    networkConfig[chainId]?.explorerUrl || "https://eth.blockscout.com/";
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const WETH_ChainAddress =
    networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to log and set factory address only when chainId changes
  useEffect(() => {
    if (!isInitialized && chainId) {
      console.log("Factory Address initialized:", factoryChainAddress);
      setIsInitialized(true);
    }
  }, [chainId, isInitialized, factoryChainAddress]);

  async function connectWallet() {
    try {
      await connect();
      console.log("Connected to chain:", chainId);
      setError("");
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  const chainName = CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;

  async function deployTokenAndAddLiquidity(e) {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet before trying to deploy a token.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const deployedAddress = await deployToken();

      if (deployedAddress) {
        await fetchTokenDetails(deployedAddress);
        await handleMulticall(deployedAddress);
      }
    } catch (error) {
      console.error("Error during token deployment and liquidity addition:", error);
      setError("There was an error with the transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deployToken() {
    let imageUrl = null;
    if (tokenImage) {
      imageUrl = await uploadImageToImgur(tokenImage);
      if (!imageUrl) {
        setError("Failed to upload image, proceeding without it.");
      } else {
        setTokenImageUrl(imageUrl);
      }
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      const txResponse = await factoryContract.deployToken(
        tokenName,
        tokenSymbol,
        ethers.parseUnits(tokenSupply, 18)
      );
      const receipt = await txResponse.wait();

      const logs = receipt.logs;
      if (logs.length > 0) {
        const deployedAddress = logs[0].address;
        setDeployedContractAddress(deployedAddress);

        const tokensCollection = collection(firestore, "tokens");
        await setDoc(doc(tokensCollection, deployedAddress), {
          name: tokenName,
          symbol: tokenSymbol,
          supply: tokenSupply,
          address: deployedAddress,
          imageUrl: imageUrl,
          deployer: connectedWallet,
          timestamp: new Date(),
          chain: CHAIN_NAMES[chainId],
        });

        const uppercaseWallet = connectedWallet.toUpperCase();
        const userPointsDoc = doc(firestore, "userPoints", uppercaseWallet);
        const userPointsSnapshot = await getDoc(userPointsDoc);

        if (userPointsSnapshot.exists()) {
          const currentPoints = userPointsSnapshot.data().points;
          await updateDoc(userPointsDoc, { points: currentPoints + 1 });
        } else {
          await setDoc(userPointsDoc, { points: 1 });
        }

        return deployedAddress;
      }
    } catch (error) {
      console.error("Error during token deployment:", error);
      setError("There was an error with the token deployment. Please try again.");
      throw error;
    }
  }

  async function fetchTokenDetails(address) {
    if (!address || !isConnected) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const tokenContract = new ethers.Contract(address, MyTokenJson.abi, provider);
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const supply = await tokenContract.totalSupply();

    const tokensCollection = collection(firestore, "tokens");
    const q = query(tokensCollection, where("address", "==", address));
    const querySnapshot = await getDocs(q);

    let imageUrl = "";
    querySnapshot.forEach((doc) => {
      imageUrl = doc.data().imageUrl;
    });

    setTokenDetails({
      name,
      symbol,
      supply: ethers.formatUnits(supply, 18).toString(),
      imageUrl,
    });
  }

  async function handleMulticall(deployedAddress) {
    try {
      const swapAmountValue = tokenAmountToBuy ? parseFloat(tokenAmountToBuy) : 0;
      const swapAmount = ethers.parseUnits(swapAmountValue.toString(), 18);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      const txAddLiquidity = await factoryContract.addLiquidityLockSwap(
        deployedAddress,
        swapAmount,
        { value: swapAmount, gasLimit: 9000000 }
      );

      console.log("Transaction Hash:", txAddLiquidity.hash);
      setTxHash(txAddLiquidity.hash);
      setSuccessMessage("Your token is now live on the blockchain. Trade it anywhere.");
    } catch (error) {
      if (error.code === "ACTION_REJECTED") {
        setError("Transaction failed: User rejected transaction.");
      } else {
        console.error(error);
        setError("Transaction failed, please try again.");
      }
      throw error;
    }
  }

  return (
    <div>
      <Header connectWallet={connectWallet} isConnected={isConnected} chainId={chainId} />
      {/* The rest of the component layout */}
    </div>
  );
}

export default CombinedFactoryDashboard;
