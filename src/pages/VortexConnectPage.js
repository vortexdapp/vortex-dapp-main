import React from 'react';
import { VortexConnectContext } from "../VortexConnectContext";

const VortexConnectPage = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <h1>Connect Your Wallet</h1>
            <VortexConnectContext />
        </div>
    );
};

export default VortexConnectPage;