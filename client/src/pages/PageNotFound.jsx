import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-xl font-semibold mt-4">Page Not Found</p>
      <p className="text-gray-500 mt-2">
        The page you are looking for doesn’t exist.
      </p>

      <button
        onClick={() => navigate("/")}
        className="mt-6 bg-green-600 text-white px-6 py-2 rounded cursor-pointer"
      >
        Go Market
      </button>
    </div>
  );
};

export default NotFound;
