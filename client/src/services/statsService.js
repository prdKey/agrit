import axios from "axios";
import { getToken } from "../auth/tokenService.js";

const API_URL = import.meta.env.VITE_API_URL;

export const getSellerStats = async (walletAddress) => {
    const res = await axios.get(`${API_URL}/users/sellerstats/${walletAddress}`);
    return res.data
}