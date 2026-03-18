// utils/jwt.js
import { jwtDecode } from "jwt-decode";

export function isTokenExpired(token) {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000; // seconds

    return decoded.exp < now;
  } catch {
    return true;
  }
}
