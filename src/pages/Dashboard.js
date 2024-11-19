import React, { useState, useEffect, useContext } from "react";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { supabase } from "../supabaseClient";
import { VortexConnectContext } from "../VortexConnectContext";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import "./Dashboard.css"; // Import CSS for styling

const CHAIN_EXPLORERS = {
  56: "https://bscscan.com/",
  42161: "https://arbiscan.io/",
  8453: "https://base.blockscout.com/",
  11155111: "https://sepolia.etherscan.io/",
  10: "https://optimistic.etherscan.io/",
  42220: "https://explorer.celo.org/mainnet/",
};

const Dashboard = () => {
  const { address, isConnected, chainId } = useContext(VortexConnectContext);
  const [userData, setUserData] = useState(null);
  const [stakingData, setStakingData] = useState([]);
  const [tokensDeployed, setTokensDeployed] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected && address) {
      fetchData();
    }
  }, [isConnected, address]);

  const fetchData = async () => {
    await Promise.all([fetchUserData(), fetchStakingData(), fetchTokensDeployed()]);
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from("usersweb")
        .select("points")
        .eq("wallet", address)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      setUserData(data || { points: 0 });
    } catch (error) {
      console.error("Unexpected error fetching user data:", error);
    }
  };

  const fetchStakingData = async () => {
    try {
      const { data, error } = await supabase
        .from("stakingEvents")
        .select("action, amount, timestamp")
        .eq("wallet", address)
        .order("timestamp", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching staking data:", error);
        return;
      }

      setStakingData(data || []);
    } catch (error) {
      console.error("Unexpected error fetching staking data:", error);
    }
  };

  const fetchTokensDeployed = async () => {
    try {
      const { data, error } = await supabase
        .from("tokens")
        .select("address, name, timestamp")
        .eq("deployer", address)
        .order("timestamp", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching tokens deployed:", error);
        return;
      }

      setTokensDeployed(data || []);
    } catch (error) {
      console.error("Unexpected error fetching tokens deployed:", error);
    }
  };

  if (!isConnected) {
    return (
      <div>
        <Header />
        <div className="dashboard-container">
          <p>Please connect your wallet to view your dashboard.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Header />
        <div className="dashboard-container">
          <h1>Profile</h1>
          <p className="subtitle">Check your Vortex activity and manage it</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="dashboard-container">
        {/* Wallet and Points Display */}
        <div className="wallet-points-display">
          <div
            className="wallet-info"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              flex: 1,
            }}
          >
            <h1 className="wallet-address">{shortenAddress(address)}</h1>
            <h2>{userData?.points || 0} Points</h2>
          </div>
        </div>

        {/* Three Columns Layout */}
        <div className="three-column-layout">
          {/* Left Column - Trading Activity (Boilerplate for now) */}
          <div className="dashboard-column">
            <h2>Trading Activity</h2>
            <p>Trading data coming soon...</p>
          </div>

          {/* Center Column - Staking Activity */}
          <div className="dashboard-column">
            <h2>Staking Activity</h2>
            {stakingData.length > 0 ? (
              <ul>
                {stakingData.map((event, index) => (
                  <li key={index}>
                    <strong>{capitalizeFirstLetter(event.action)}</strong>: {event.amount} ETH
                  </li>
                ))}
              </ul>
            ) : (
              <p>No staking activities found.</p>
            )}
          </div>

          {/* Right Column - Tokens Deployed */}
          <div className="dashboard-column">
            <h2>Tokens Deployed</h2>
            {tokensDeployed.length > 0 ? (
              <ul>
                {tokensDeployed.map((token, index) => (
                  <li key={token.address || index}>
                    <strong>
                      <Link
                        to={`/token-management/${token.address}`}
                        className="token-link"
                      >
                        {token.name}
                      </Link>
                    </strong>
                    
                  </li>
                ))}
              </ul>
            ) : (
              <p>No tokens deployed.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Helper Functions

const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default Dashboard;
