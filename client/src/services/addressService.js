import axios from "axios";
import { getToken } from "./tokenService";

const API_URL = import.meta.env.VITE_API_URL;
const PSGC_BASE = "https://psgc.cloud/api/v2";

const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// ── PSGC (Philippine Standard Geographic Code) ───────────────────────────────

export const getPangasinanCities = async () => {
  const res = await axios.get(`${PSGC_BASE}/provinces/0105500000/cities-municipalities`);
  return res.data;
};

export const getBarangaysByCity = async (cityCode) => {
  const res = await axios.get(`${PSGC_BASE}/cities-municipalities/${cityCode}/barangays`);
  return res.data;
};

// ── Address CRUD ──────────────────────────────────────────────────────────────

export const getAddresses = async () => {
  const res = await axios.get(`${API_URL}/addresses`, { headers: authHeader() });
  // Always return an array for safe .filter/.map usage
  return res.data?.addresses ?? [];
};

export const getAddressById = async (id) => {
  const res = await axios.get(`${API_URL}/addresses/${id}`, { headers: authHeader() });
  return res.data;
};

export const createAddress = async (data) => {
  const res = await axios.post(`${API_URL}/addresses`, data, { headers: authHeader() });
  return res.data;
};

export const updateAddress = async (id, data) => {
  const res = await axios.put(`${API_URL}/addresses/${id}`, data, { headers: authHeader() });
  return res.data;
};

export const setDefaultAddress = async (id) => {
  const res = await axios.patch(`${API_URL}/addresses/${id}/default`, {}, { headers: authHeader() });
  return res.data;
};

export const deleteAddress = async (id) => {
  const res = await axios.delete(`${API_URL}/addresses/${id}`, { headers: authHeader() });
  return res.data;
};