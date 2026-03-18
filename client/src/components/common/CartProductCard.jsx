


export default function CartProductCard({ item, decrement, increment, removeItem}) {
  return (
    <div className="w-full p-4 bg-white rounded-lg mt-2 overflow-hidden shadow-sm">
      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-[6fr_1fr_1fr_1fr_1fr] items-center gap-2">
        {/* Product Info */}
        <div className="flex items-center space-x-4 min-w-0">
          <input type="checkbox"  className="w-5 h-5 shrink-0" />
          <img
            
            src={`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${item.imageCID}`}
            alt={item.name}
            className="w-20 h-20 object-cover rounded shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold truncate">{item.name}</div>
            <div className="text-gray-500 text-sm truncate">
              Category: {item.category}
            </div>
          </div>
        </div>

        {/* Unit Price */}
        <div className="text-center truncate">{item.pricePerUnit} AGT</div>

        {/* Quantity */}
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => decrement(item.productId, item.quantity)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            −
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={() => increment(item.productId, item.quantity)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            +
          </button>
        </div>

        {/* Total Price */}
        <div className="text-center text-red-500 truncate">
          {item.totalPrice} AGT
        </div>

        {/* Actions */}
        <div className="text-center space-x-2">
          <button
            onClick={() => removeItem(item.id)}
            className="text-red-500 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col gap-2">
        <div className="flex items-center space-x-4">
          <input type="checkbox" className="w-5 h-5 shrink-0" />
          <img
            src={`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${item.image}`}
            alt={item.name}
            className="w-20 h-20 object-cover rounded shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{item.name}</div>
            <div className="text-gray-500 text-sm truncate">
              Category: {item.category}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between text-sm text-gray-700">
          <div>Unit Price: {item.pricePerUnit} AGT</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => decrement(item.productId, item.quantity)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              −
            </button>
            <span>{item.quantity}</span>
            <button
              onClick={() => increment(item.productId, item.quantity)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
          <div className="text-red-500">Total: {item.totalPrice} AGT</div>
          <div>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
