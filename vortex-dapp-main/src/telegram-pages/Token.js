// telegram-web-app/src/telegram-pages/Token.js
import React from "react";
import { useParams } from "react-router-dom";
import "./Token.css";

const Token = ({ tokenList }) => {
  const { symbol } = useParams();
  const token = tokenList.find((token) => token.symbol === symbol);

  if (!token) {
    return <div>Token not found</div>;
  }

  return (
    <div className="token-page">
      <img src={token.logo} alt={`${token.name} logo`} className="token-logo" />
      <h2>
        {token.name} ({token.symbol})
      </h2>
      <p>Market Cap: ${token.marketCap}</p>

      {/* DexTools Chart */}
      <div className="chart-container">
        <iframe
          id="dextools-widget"
          title="DEXTools Trading Chart"
          width="500"
          height="400"
          src="https://www.dextools.io/widget-chart/en/solana/pe-light/3ne4mWqdYuNiYrYZC9TrA3FcfuFdErghH97vNPbjicr1?theme=light&chartType=2&chartResolution=30&drawingToolbars=false"
        ></iframe>
      </div>

      {/* Swap Component */}
      <button className="trade-button">Swap {token.symbol}</button>
    </div>
  );
};

export default Token;
