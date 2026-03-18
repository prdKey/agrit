import axios from "axios";
import { getToken } from "./tokenService";

const API_URL    = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

// Call after login — ensures user has sFUEL for transactions
export const ensureSFuel = async (walletAddress) => {
    
  try {
    const res = await axios.post(
      `${API_URL}/sfuel/distribute`,
      { walletAddress },
      { headers: authHeader() }
    );
    console.log(res.data)
    return res.data;
    
  } catch (err) {
    // Non-blocking — don't throw, user can still try
    console.warn("sFUEL distribution failed:", err.message);
  }
};