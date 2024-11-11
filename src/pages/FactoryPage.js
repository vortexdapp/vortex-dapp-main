// FactoryPage.js
import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";
import "./FactoryPage.css";
import { Link } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { supabase } from "../supabaseClient";
import { VortexConnectContext } from "../VortexConnectContext";

const networkConfig = {
  8453: {
    factoryAddress: "0xF686e6CAF7d823E4130339E6f2b02C37836fE90F",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://base.blockscout.com/",
  },
  11155111: {
    factoryAddress: process.env.REACT_APP_FACTORY_SEPOLIA_CA,
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://eth-sepolia.blockscout.com/",
  },
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

function FactoryPage() {
  const [contractAddress, setContractAddress] = useState(null);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [tokenImage, setTokenImage] = useState(null);
  const [tokenImageUrl, setTokenImageUrl] = useState(null);
  const [deployedContractAddress, setDeployedContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Use VortexConnectContext
  const { address: connectedWallet, chainId, isConnected, connectMetaMask: connect, disconnectWallet: disconnect } = useContext(VortexConnectContext);

  const explorerUrl = networkConfig[chainId]?.explorerUrl || "https://eth.blockscout.com/";
  const factoryChainAddress = networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";

  useEffect(() => {
    if (!isInitialized && chainId) {
      console.log("Factory Address initialized:", factoryChainAddress);
      setIsInitialized(true);
    }
  }, [chainId, isInitialized, factoryChainAddress]);

  const chainName = CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;

  async function deployToken(e) {
    e.preventDefault();
  
    if (!isConnected) {
      setError("Please connect your wallet before trying to deploy a token.");
      return;
    }
  
    setIsLoading(true);
    setError(""); // Clear any existing error at the start
  
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
        tokenSupply
      );
      const receipt = await txResponse.wait();
  
      const logs = receipt.logs;
      if (logs.length > 0) {
        const deployedAddress = logs[0].address;
        setDeployedContractAddress(deployedAddress);
        setError(""); // Clear any previous errors after a successful deployment
  
        // Insert token details into the tokens table
        const { error: tokenInsertError } = await supabase.from("tokens").insert([
          {
            name: tokenName,
            symbol: tokenSymbol,
            supply: tokenSupply,
            address: deployedAddress,
            imageUrl: imageUrl,
            deployer: connectedWallet,
            timestamp: new Date().toISOString(),
            chain: CHAIN_NAMES[chainId],
          },
        ]);
  
        if (tokenInsertError) {
          throw tokenInsertError;
        }
  
        // Increment the points for the user in the usersweb table
        const { data: userData, error: fetchError } = await supabase
          .from("usersweb")
          .select("points")
          .eq("wallet", connectedWallet)
          .single(); // Fetch single row for the connected wallet
  
        if (fetchError) {
          console.error("Error fetching user points:", fetchError);
        } else {
          const currentPoints = userData ? userData.points : 0;
  
          // Update the points by adding 1
          const { error: updateError } = await supabase
            .from("usersweb")
            .update({ points: currentPoints + 1 })
            .eq("wallet", connectedWallet);
  
          if (updateError) {
            throw updateError;
          }
        }
      }
    } catch (error) {
      console.error("Error during transaction:", error);
      setError("There was an error with the transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }
  
    
  return (
    <div>
      <Header connectWallet={connect} isConnected={isConnected} chainId={chainId} />
      <div>
        <h1 className="titlefactory">Launch your new ERC20 token</h1>
        <h3 className="subtitlefactory">
          Vortex provides liquidity lending to launch tokens, directly on Uniswap.
        </h3>
      </div>
      <div className="center-container">
        <div className="factory-container">
          <h2 className="createerc">Create Your New Token</h2>
          <form onSubmit={deployToken} className="token-form">
            <div className="custom-file-input">
              <span>Add image here</span>
              <input
                type="file"
                id="tokenImage"
                accept="image/*"
                onChange={(e) => setTokenImage(e.target.files[0])}
                className="input"
              />
              {tokenImage && (
                <div>
                  <img
                    src={URL.createObjectURL(tokenImage)}
                    alt="Token Preview"
                    style={{ maxWidth: "100px", maxHeight: "100px" }}
                  />
                </div>
              )}
            </div>

            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Token Name"
              className="input"
            />
            <br />
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="Token Symbol"
              className="input"
            />
            <br />
            <input
              type="number"
              value={tokenSupply}
              onChange={(e) => setTokenSupply(Math.min(10000000000000, Number(e.target.value)))}
              placeholder="Total Supply"
              className="input"
            />
            <br />

            {!deployedContractAddress && (
              <button type="submit" className="deploy-button">
                {isLoading ? "Loading..." : "Create Token"}
              </button>
            )}
          </form>
          {error && <p className="error-message">{error}</p>}
          {deployedContractAddress && (
            <>
              <p className="token_address_message">
                Your new token address is:{" "}
                <a href={`${explorerUrl}/address/${deployedContractAddress}`} target="_blank" rel="noreferrer">
                  Check CA on BlockScout
                </a>
              </p>

              <Link to={`/dashboard/${deployedContractAddress}`}>
                <button className="deploy-button">Next Step</button>
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default FactoryPage;
