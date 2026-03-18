import { useEffect, useState } from "react";

export default function Notification({ message, type = "info", duration = 3000, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for animation before removing
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    info: "bg-blue-500",
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
  }[type];

  return (
    <div
      className={`fixed bottom-5 right-5 max-w-xs w-full p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      } ${bgColor}`}
    >
      {message}
    </div>
  );
}
