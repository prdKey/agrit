import axios from "axios";
import { getToken } from "./tokenService.js";

const API_URL = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// ── Profile ───────────────────────────────────────────────────────────────────
export const getProfile = async () => {
  const res = await axios.get(`${API_URL}/users/profile`, { headers: authHeader() });
  return res.data?.user;
};

export const updateProfile = async (form) => {
  const res = await axios.put(`${API_URL}/users/profile`, form, { headers: authHeader() });
  return res.data?.user;
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getBalance = async () => {
  const res = await axios.get(`${API_URL}/users/balance`, { headers: authHeader() });
  return res.data;
};

// ── User management ───────────────────────────────────────────────────────────
export const getAllUsers = async () => {
  const res = await axios.get(`${API_URL}/users`, { headers: authHeader() });
  return res.data?.users ?? [];
};

export const getUserById = async (id) => {
  const res = await axios.get(`${API_URL}/users/${id}`, { headers: authHeader() });
  return res.data?.user;
};

export const toggleUserStatus = async (id) => {
  const res = await axios.patch(`${API_URL}/users/${id}/status`, {}, { headers: authHeader() });
  return res.data?.user;
};

export const changeUserRole = async (id, role) => {
  const res = await axios.patch(`${API_URL}/users/${id}/role`, { role }, { headers: authHeader() });
  return res.data?.user;
};

// ── Applications ──────────────────────────────────────────────────────────────
export const submitApplication = async (roleApplying) => {
  const res = await axios.post(`${API_URL}/users/applications`, { roleApplying }, { headers: authHeader() });
  return res.data?.application;
};

export const getMyApplications = async () => {
  const res = await axios.get(`${API_URL}/users/applications/mine`, { headers: authHeader() });
  return res.data?.applications ?? [];
};

export const getAllApplications = async (status = "") => {
  const params = status ? `?status=${status}` : "";
  const res = await axios.get(`${API_URL}/users/applications/all${params}`, { headers: authHeader() });
  return res.data?.applications ?? [];
};

export const reviewApplication = async (id, status, adminNotes = "") => {
  const res = await axios.patch(
    `${API_URL}/users/applications/${id}/review`,
    { status, adminNotes },
    { headers: authHeader() }
  );
  return res.data?.application;
};