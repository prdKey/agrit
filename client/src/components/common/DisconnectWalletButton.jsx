import React from 'react'
import { useAuth } from "../../context/AuthContext.jsx";

export default function Logout() {
    const { logout } = useAuth();
  return (
    <button
      onClick={logout}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
        Disconnect Wallet
    </button>
  )
}
