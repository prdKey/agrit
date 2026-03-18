import axios from "axios";
import { getToken } from "./tokenService";

const API_URL    = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const submitRating = async (orderId, rating, comment, productId) => {
  const res = await axios.post(
    `${API_URL}/ratings`,
    { orderId, rating, comment, productId},
    { headers: authHeader() }
  );
  return res.data;
};

export const getProductRatings = async (productId) => {
  const res = await axios.get(`${API_URL}/ratings/product/${productId}`);
  return res.data;
};

export const checkOrderRating = async (orderId) => {
  const res = await axios.get(
    `${API_URL}/ratings/order/${orderId}/check`,
    { headers: authHeader() }
  );
  return res.data;
};