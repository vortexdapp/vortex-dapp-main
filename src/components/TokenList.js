// src/components/TokensList.js

import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // Import the Supabase client
import { FaTwitter, FaTelegram, FaGlobe } from "react-icons/fa"; // Adjusted icons import
import "./TokenList.css";

function TokensList({ limit }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // Fetch tokens from Supabase
        const { data: tokensArray, error } = await supabase
          .from("tokens")
          .select("*");

        if (error) {
          throw error;
        }

        // Map tokens and parse timestamp
        const tokensWithParsedData = tokensArray.map((token) => {
          return {
            ...token,
            timestamp: token.timestamp ? new Date(token.timestamp) : null,
          };
        });

        // Sort tokens by timestamp in descending order (most recent first)
        const sortedTokens = tokensWithParsedData.sort(
          (a, b) => b.timestamp - a.timestamp
        );

        setTokens(sortedTokens);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  if (loading)
    return (
      <div className="loading-container">
        <p>Loading tokens...</p>
      </div>
    );
  if (!tokens.length) return <p>No tokens found.</p>;

  const displayedTokens = limit ? tokens.slice(0, limit) : tokens;

  return (
    <div className="tokens-container">
      <h3 className="deployedtokenstitle">Deployed Tokens</h3>
      <h5 className="subtitletokens">Trade them directly on Uniswap</h5>
      <div className="tokens-grid">
        {displayedTokens.map((token) => (
          <div key={token.address} className="token-card">
            {token.imageUrl && (
              <img
                src={token.imageUrl}
                alt={token.name}
                className="token-image"
              />
            )}
            <div className="token-info">
              <h2 className="token-title">
                {token.name} ({token.symbol})
              </h2>
              <h4 className="token-deployer">
                Contract Address: {token.address}
              </h4>
              <h4 className="token-deployer">Chain: {token.chain}</h4>
              <div className="social-links">
                {token.website && (
                  <a
                    href={`https://${token.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link2"
                  >
                    <FaGlobe className="icon2" />
                  </a>
                )}
                {token.twitter && (
                  <a
                    href={`https://${token.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link2"
                  >
                    <FaTwitter className="icon2" />
                  </a>
                )}
                {token.telegram && (
                  <a
                    href={`https://${token.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link2"
                  >
                    <FaTelegram className="icon2" />
                  </a>
                )}
              </div>
              <button
                className="trade-button"
                onClick={() =>
                  (window.location.href = `/trading/${token.chain}/${token.address}`)
                }
              >
                Trade
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TokensList;
