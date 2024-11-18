import React from "react";
import TokenListTable from "../components/TokenListTable.js";
import TokenList from "../components/TokenList.js";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import "./TokenListPage.css"; // Import the CSS file for TokensPage

function TokensPage() {
  return (
    <div>
      <Header />
      <div className="token-list-desktop">
        <TokenListTable />
      </div>
      <div className="token-list-mobile">
        <TokenList />
      </div>
      <Footer />
    </div>
  );
}

export default TokensPage;
