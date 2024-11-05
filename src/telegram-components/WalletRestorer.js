import { useEffect, useState } from "react";
import { useWallet } from "../WalletContext";
import { restoreWalletIfNeeded } from "../WalletManager";

const WalletRestorer = ({ username }) => {
  const { wallet, setExistingWallet } = useWallet();
  const [restorationAttempted, setRestorationAttempted] = useState(false);

  useEffect(() => {
    const restoreWallet = async () => {
      if (!wallet && username && !restorationAttempted) {
        setRestorationAttempted(true); // Prevent multiple attempts
        const success = await restoreWalletIfNeeded(
          wallet,
          setExistingWallet,
          username
        );
        if (!success) {
          // Only reset if you want to allow retries on failure
          setRestorationAttempted(false);
        }
      }
    };

    restoreWallet();
  }, [wallet, username, restorationAttempted, setExistingWallet]);

  return null; // This component doesn't render anything, purely logic
};

export default WalletRestorer;
