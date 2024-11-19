// src/pages/TokenManagement.js

import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { supabase } from "../supabaseClient";
import { VortexConnectContext } from "../VortexConnectContext";
import "./TokenManagement.css"; // Import CSS for styling

const TokenManagement = () => {
  const { tokenAddress } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useContext(VortexConnectContext);
  
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect to home if not connected
    if (!isConnected) {
      navigate("/");
      return;
    }

    const fetchTokenData = async () => {
      try {
        const { data, error } = await supabase
          .from("tokens")
          .select("address, name, timestamp, deployer")
          .eq("address", tokenAddress)
          .single();

        if (error) {
          console.error("Error fetching token data:", error);
          setError("Failed to fetch token data.");
          setLoading(false);
          return;
        }

        if (data.deployer.toLowerCase() !== address.toLowerCase()) {
          setAccessDenied(true);
        } else {
          setTokenData(data);
        }

        setLoading(false);
      } catch (err) {
        console.error("Unexpected error fetching token data:", err);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [isConnected, address, tokenAddress, navigate]);

  if (!isConnected) {
    return (
      <div>
        <Header />
        <div className="token-management-container">
          <p>Please connect your wallet to view this page.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Header />
        <div className="token-management-container">
          <h1>Loading...</h1>
          <p>Please wait while we verify your access.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div>
        <Header />
        <div className="token-management-container">
          <h1>Access Denied</h1>
          <p>You do not have permission to manage this token.</p>
          <button onClick={() => navigate("/")} className="back-button">
            Go Back to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="token-management-container">
          <h1>Error</h1>
          <p>{error}</p>
          <button onClick={() => navigate("/")} className="back-button">
            Go Back to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="token-management-container">
        <h1>Token Management</h1>
        <h2>{tokenData.name}</h2>
        
        <p><strong>Token Address:</strong> {tokenData.address}</p>
        <p><strong>Deployed On:</strong> {new Date(tokenData.timestamp).toLocaleDateString()}</p>
        {/* Add more token-specific management features here */}
      </div>
      <Footer />
    </div>
  );
};

// Export the component
export default TokenManagement;
