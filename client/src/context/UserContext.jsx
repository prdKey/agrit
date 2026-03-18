import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isTokenExpired } from "../utils/jwt";

const UserContext = createContext();

export function UserProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    const loadUser = () => {
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                // 🔥 CHECK TOKEN EXPIRATION HERE
                if (isTokenExpired(parsedUser.token)) {
                localStorage.removeItem("user");
                setUserState(null);
                navigate("/"); // redirect to login
                } else {
                setUserState(parsedUser);
                }
            } catch (err) {
                console.error("Failed to parse user from localStorage:", err);
                localStorage.removeItem("user");
                setUserState(null);
            }
        }
        setLoading(false);
    }

    loadUser();
    
  }, [navigate]);

  // Login
  const login = (newUser) => {
    if (!newUser?.token) return;

    localStorage.setItem("user", JSON.stringify(newUser));
    setUserState(newUser);
    navigate("/");
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("user");
    setUserState(null);
    navigate("/");
  };

  return (
    <UserContext.Provider value={{ user, login, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
