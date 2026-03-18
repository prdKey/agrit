import axios from "axios";
import { getToken } from "./tokenService";

const API_URL    = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const getNotifications = async () => {
  const res = await axios.get(`${API_URL}/notifications`, { headers: authHeader() });
  return res.data;
};

export const markAsRead = async (id) => {
  const res = await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers: authHeader() });
  return res.data;
};

export const markAllAsRead = async () => {
  const res = await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: authHeader() });
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await axios.delete(`${API_URL}/notifications/${id}`, { headers: authHeader() });
  return res.data;
};

export const deleteAllRead = async () => {
  const res = await axios.delete(`${API_URL}/notifications/read`, { headers: authHeader() });
  return res.data;
};