import axios from "axios";
import { getToken } from "./tokenService.js";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

/* Get total AGT supply */
export const getTotalSupply = async () => {
  const res = await axios.get(`${API}/tokens/total-supply`, { headers: authHeader() });
  return res.data.totalSupply;
};

/* Get AGT balance of any address */
export const getBalance = async (address) => {
  const res = await axios.get(`${API}/tokens/balance/${address}`, { headers: authHeader() });
  return res.data.balance;
};

/* Mint AGT to an address (admin only) */
export const mintTokens = async (to, amount) => {
  const res = await axios.post(`${API}/tokens/mint`, { to, amount }, { headers: authHeader() });
  return res.data;
};

/* Transfer AGT from admin wallet to an address (admin only) */
export const transferTokens = async (to, amount) => {
  const res = await axios.post(`${API}/tokens/transfer`, { to, amount }, { headers: authHeader() });
  return res.data;
};