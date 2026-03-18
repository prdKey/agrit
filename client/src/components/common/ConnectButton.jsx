import React from 'react'
import { getNonce, verifySignature} from "../../services/authService.js";
import { useUserContext } from '../../context/UserContext.jsx';

export default function ConnectButton({text,firstName, lastName, email, mobileNumber, gender, dob, houseNumber, street, barangay, city, postalCode}) {
    const { login } = useUserContext();

    const connectWallet = async() => {
        if (!window.ethereum) return alert("Please install MetaMask!");
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        return accounts[0];
    }

    const handleLogin = async () => {
    try {
      const walletAddress = await connectWallet();
      const nonce = await getNonce(walletAddress, firstName, lastName, email, mobileNumber, gender, dob, houseNumber, street, barangay, city, postalCode);
      const messageToSign = `Sign this message to authenticate: ${nonce}`;

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [messageToSign, walletAddress],
      });

      const user = await verifySignature(walletAddress, signature);
      login(user)


      alert("Login successful!");
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  return (
    <button  onClick={handleLogin} className="bg-green-600 rounded-lg text-white p-4 cursor-pointer hover:bg-green-500">
        {text}
    </button>
  )
}
