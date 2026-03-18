import React from "react";

export default function SellerProductCard({ product, handleEdit, handleDelete }) {
  return (
    <div className="group cursor-pointer bg-white rounded-xl border border-gray-200 hover:border-green-600 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden w-full">
      
      {/* Image */}
      <img
        src={`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${product.imageCID}`}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Content */}
      <div className="flex flex-col flex-1 mt-3 p-4">
        
        {/* Top info */}
        <div>
          <h2 className="font-semibold text-base line-clamp-1">
            {product.name}
          </h2>

          <p className="text-xs text-gray-500">
            ID: {product.id}
          </p>

          <p className="text-sm text-gray-500">
            {product.category}
          </p>

          <p className="mt-1 font-semibold">
            {product.pricePerUnit} AGT
          </p>

          <p className="text-sm text-gray-600">
            Stock: {product.stock}
          </p>
        </div>

        {/* Actions (locked at bottom) */}
        <div className="mt-auto pt-3 flex gap-3 border-t border-gray-100">
          <button
            onClick={() => handleEdit(product)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>

          <button
            onClick={() => handleDelete(product.id)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
