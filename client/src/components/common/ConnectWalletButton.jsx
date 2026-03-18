import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { loginWithWallet, verifySignature} from "../../auth/authService.js";
import { ethers } from "ethers";

export default function ConnectWalletButton() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const connectWalletAndLogin = async () => {
    if (!window.ethereum) return alert("MetaMask not detected!");
    setLoading(true);

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const nonce = await loginWithWallet(address);
      const signature = await signer.signMessage(`AgriTrust Login: ${nonce}`);
      const data = await verifySignature(address, signature);
      login(data);
    } catch (err) {
      console.error(err);
      alert("Login failed: " + err.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={connectWalletAndLogin}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded cursor-pointers"
    >
      {loading ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
