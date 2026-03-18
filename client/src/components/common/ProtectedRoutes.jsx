import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/UserContext.jsx";
import Loader from "./Loader";

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // wait until user is loaded

    // If not logged in, redirect to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // If role not allowed, redirect somewhere (home or unauthorized page)
    if (roles.length > 0 && !roles.includes(user.role)) {
      navigate("/unauthorized", { replace: true });
    }
  }, [user, loading, navigate, roles]);

  // Show loader while checking user
  if (loading || !user) return <Loader />;

  // Show children only if user is logged in and role allowed
  if (roles.length > 0 && !roles.includes(user.role)) return null;

  return children;
}
