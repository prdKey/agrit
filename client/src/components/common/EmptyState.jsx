import { PackageSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmptyState({ title = "Product not found", description = "The product you’re looking for doesn’t exist or has been removed.", actionLabel, navigateTo,}) {
    const navigate = useNavigate();

    const onAction = () =>
    {
        navigate(`/${navigateTo}`)
    }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center text-center">
      
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <PackageSearch className="w-8 h-8 text-gray-400" />
      </div>

      {/* Text */}
      <h2 className="mt-4 text-lg font-semibold text-gray-800">
        {title}
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        {description}
      </p>

      {/* Action */}
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
