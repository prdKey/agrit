import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export const getNonce = async (walletAddress, firstName, lastName, email, mobileNumber, gender, dob, houseNumber, street, barangay, city, postalCode) => {
  const res = await axios.post(`${API_URL}/auth/nonce`, {walletAddress, firstName, lastName, email, mobileNumber, gender, dob, houseNumber, street, barangay, city, postalCode});
  
  return res.data.nonce;
};

export const verifySignature = async (walletAddress, signature) => {
  const res = await axios.post(`${API_URL}/auth/verify-signature`, { walletAddress, signature });
  return res.data.user;
};