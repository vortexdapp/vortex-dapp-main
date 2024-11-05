import React from 'react';
import VortexConnect from '../components/VortexConnect';

const VortexConnectPage = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <h1>Connect Your Wallet</h1>
            <VortexConnect />
        </div>
    );
};

export default VortexConnectPage;