import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { useUserContext } from "../context/UserContext.jsx";
import { getNonce, verifySignature } from "../services/authService.js";
import { ensureSFuel } from "../services/sFuelService.js";
import { switchToSkaleNetwork } from "../utils/skaleNetwork.js";

export default function Login() {
  const { login, user } = useUserContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");

  const { open }           = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { disconnect }     = useDisconnect();

  // Auto-trigger signing after wallet connects
  useEffect(() => {
    if (isConnected && address && walletProvider && loading) {
      handleSign(address, walletProvider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, walletProvider]);

  const handleSign = async (walletAddress, provider) => {
    setNetworkError("");
    try {
      // ── 1. Ensure correct network before anything else ─────────────────
      try {
        await switchToSkaleNetwork(provider);
      } catch (netErr) {
        // User rejected the network switch prompt
        setNetworkError("Please switch to SKALE Europa Hub Testnet to continue.");
        setLoading(false);
        return;
      }

      // ── 2. Get nonce ───────────────────────────────────────────────────
      let nonce;
      try {
        nonce = await getNonce(walletAddress);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        alert(message);
        return;
      }

      // ── 3. Sign & verify ───────────────────────────────────────────────
      const ethersProvider  = new BrowserProvider(provider);
      const signer          = await ethersProvider.getSigner();
      const messageToSign   = `Sign this message to authenticate: ${nonce}`;
      const signature       = await signer.signMessage(messageToSign);

      const loggedInUser = await verifySignature(walletAddress, signature);
      login(loggedInUser);
      ensureSFuel(walletAddress);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setNetworkError("");
    setLoading(true);
    try {
      if (!isConnected) {
        await open();
        // handleSign fires via useEffect once wallet connects
      } else {
        await handleSign(address, walletProvider);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to open wallet modal");
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div onClick={() => navigate("/")} className="absolute inset-0 bg-black/50" />
      <div className="relative z-50 bg-white shadow-xl rounded-lg p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
            alt="Wallet"
            className="h-16 w-16"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome</h1>
        <p className="text-gray-500 mb-6">
          {user
            ? `Logged in as ${user.firstName}`
            : "Connect your wallet to continue."}
        </p>

        {/* Network error banner */}
        {networkError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-left flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>{networkError}</span>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full p-2 rounded-lg text-white mb-3 transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {loading
            ? "Processing..."
            : isConnected
            ? "Re-authenticate"
            : "Connect Wallet"}
        </button>

        {/* Connected wallet info + disconnect */}
        {isConnected && address && (
          <div className="mb-3 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Connected</p>
              <p className="text-xs text-gray-700 font-mono font-semibold">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              <p className="text-[10px] text-green-600 font-medium mt-0.5">
                SKALE Europa Testnet
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-500 hover:text-red-600 font-semibold border border-red-200 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}

        <div className="flex justify-center mt-2">
          <p
            onClick={() => navigate("/register")}
            className="text-xs text-gray-400 font-light cursor-pointer hover:underline transition-colors hover:text-green-600"
          >
            New User? Register your wallet
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          By continuing, you agree to our Terms & Conditions
        </p>
      </div>
    </div>
  );
}