// shared/auth/authService.js

import axios from "axios";

const API = "http://localhost:3001/api";

export const loginWithWallet = async (walletAddress) => {
  const res = await axios.post(`${API}/auth/wallet-login`, { walletAddress });
  return res.data.nonce;         
};

export const verifySignature = async (walletAddress, signature) => {
    const res = await axios.post(`${API}/auth/verify`, { walletAddress, signature });  
    return res.data;
}

export const registerWithWallet = async (walletAddress, firstName, lastName, email, phone, gender, dob) => {
  const res = await axios.post(`${API}/auth/wallet-register`, { walletAddress, firstName, lastName, email, phone, gender, dob });
  return res.data;
};
