// src/components/TokensListTable.js

import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // Import the Supabase client
import { FaTwitter } from "react-icons/fa"; // Adjusted the import for Twitter icon
import axios from "axios";
import "./TokenListTable.css";

function TokensListTable({ limit }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest");
  const [sortBy, setSortBy] = useState("date");
  const [selectedChain, setSelectedChain] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const tokensPerPage = 10;

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

        // Map tokens and parse timestamp and supply
        const tokensWithParsedData = tokensArray.map((token) => {
          return {
            ...token,
            timestamp: token.timestamp ? new Date(token.timestamp) : null,
            supply: token.supply ? Number(token.supply) : 0,
          };
        });

        // Fetch price, market cap, and volume data from DEX Screener API
        const updatedTokensArray = await Promise.all(
          tokensWithParsedData.map(async (token) => {
            try {
              const response = await axios.get(
                `https://api.dexscreener.com/latest/dex/tokens/${token.address}`
              );

              const pairData =
                response.data.pairs && response.data.pairs.length > 0
                  ? response.data.pairs[0]
                  : null;

              const price = pairData?.priceUsd
                ? parseFloat(pairData.priceUsd)
                : null;
              const volume24h = pairData?.volume?.h24
                ? parseFloat(pairData.volume.h24)
                : null;
              const marketCap =
                price !== null && token.supply
                  ? price * token.supply
                  : null;

              return {
                ...token,
                price,
                volume24h,
                marketCap,
              };
            } catch (error) {
              console.error(
                `Error fetching data for token ${token.address}:`,
                error
              );
              return {
                ...token,
                price: null,
                volume24h: null,
                marketCap: null,
              };
            }
          })
        );

        // Sort tokens by date (newest to oldest) by default
        const sortedTokens = updatedTokensArray.sort(
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

  const sortTokens = (by, order) => {
    const sorted = [...tokens].sort((a, b) => {
      switch (by) {
        case "date":
          return order === "newest"
            ? b.timestamp - a.timestamp
            : a.timestamp - b.timestamp;
        case "marketCap":
          return order === "desc"
            ? (b.marketCap || 0) - (a.marketCap || 0)
            : (a.marketCap || 0) - (b.marketCap || 0);
        case "volume":
          return order === "desc"
            ? (b.volume24h || 0) - (a.volume24h || 0)
            : (a.volume24h || 0) - (b.volume24h || 0);
        default:
          return 0;
      }
    });
    setTokens(sorted);
    setSortBy(by);
    setSortOrder(order);
    setCurrentPage(1); // Reset to the first page when sorting
  };

  const filterByChain = (chain) => {
    setSelectedChain(chain);
    setShowFilterOptions(false);
    setCurrentPage(1); // Reset to the first page when filtering
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const copyToClipboard = (address) => {
    navigator.clipboard
      .writeText(address)
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };
  
  if (loading)
    return (
      <div className="loading-container">
        <p>Loading tokens...</p>
      </div>
    );
  if (!tokens.length) return <p>No tokens found.</p>;

  const filteredTokens =
    selectedChain === "all"
      ? tokens
      : tokens.filter(
          (token) => token.chain && token.chain.toLowerCase() === selectedChain.toLowerCase()
        );

  const displayedTokens = filteredTokens.slice(
    (currentPage - 1) * tokensPerPage,
    currentPage * tokensPerPage
  );

  const totalPages = Math.ceil(filteredTokens.length / tokensPerPage);

  return (
    <div className="tokens-container">
      <h3 className="titlelaunch">Deployed Tokens</h3>
      <h5 className="subtitletokens">Choose a token and start trading</h5>
      <div className="sort-container">
        <button
          className="sort-button"
          onClick={() =>
            sortTokens(
              "date",
              sortOrder === "newest" ? "oldest" : "newest"
            )
          }
        >
          Sort by {sortOrder === "newest" ? "Oldest" : "Newest"} ↓
        </button>
        <div className="filter-container">
          <button
            className="filter-button"
            onClick={() => setShowFilterOptions(!showFilterOptions)}
          >
            Filter by Chain
          </button>
          {showFilterOptions && (
            <div className="filter-options">
              <button
                className="chain-list"
                onClick={() => filterByChain("all")}
              >
                All Chains
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Sepolia")}
              >
                Sepolia
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Base")}
              >
                Base
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("BSC")}
              >
                BSC
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("OP")}
              >
                OP
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Arbitrum")}
              >
                Arbitrum
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Blast")}
              >
                Blast
              </button>
            </div>
          )}
        </div>
      </div>
      <table className="tokens-table">
        <thead>
          <tr>
            <th>Logo</th>
            <th>Name</th>
            <th>Contract Address</th>
            <th>Chain</th>
            <th>Created</th>
            <th>Market Cap</th>
            <th>24h Volume</th>
            <th>Socials</th>
            <th>Trade</th>
          </tr>
        </thead>
        <tbody>
          {displayedTokens.map((token) => (
            <tr key={token.address}>
              <td>
                {token.imageUrl && (
                  <img
                    src={token.imageUrl}
                    alt={token.name}
                    className="token-image"
                  />
                )}
              </td>
              <td>
                {token.name} ({token.symbol})
              </td>
              <td className="address-cell">
  <span>{`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}</span>{" "}
  <button
    className="copy-button"
    onClick={() => copyToClipboard(token.address)}
  >
    Copy
  </button>
</td>

              <td>{token.chain || "N/A"}</td>
              <td>
                {token.timestamp
                  ? token.timestamp.toLocaleDateString()
                  : "N/A"}
              </td>
              <td>
                {token.marketCap !== null
                  ? `$${token.marketCap.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td>
                {token.volume24h !== null
                  ? `$${token.volume24h.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td>
                {token.twitter && (
                  <a
                    href={`https://${token.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTwitter className="icon2" />
                  </a>
                )}
              </td>
              <td className="trade-button-cell">
                <button
                  className="trade-button"
                  onClick={() =>
                    (window.location.href = `/trading/${token.chain}/${token.address}`)
                  }
                >
                  Trade
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button
          className="page-button"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="page-button"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default TokensListTable;
