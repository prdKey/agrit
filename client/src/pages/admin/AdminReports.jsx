import { useEffect, useState } from "react";

export default function AdminReports() {
  const [stats, setStats] = useState({
    totalSales: "12.5 ETH",
    totalOrders: 542,
    totalProducts: 210,
    totalSellers: 54,
  });

  const topProducts = [
    { name: "Bamboo Chair", sold: 120 },
    { name: "Woven Bag", sold: 95 },
    { name: "Native Hat", sold: 60 },
  ];

  const orders = {
    completed: 490,
    cancelled: 20,
    refunded: 12,
    disputed: 20,
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* TITLE */}
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Reports & Analytics
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Total Sales</p>
          <h2 className="text-2xl font-bold text-green-600">
            {stats.totalSales}
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Total Orders</p>
          <h2 className="text-2xl font-bold text-green-600">
            {stats.totalOrders}
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Total Products</p>
          <h2 className="text-2xl font-bold text-green-600">
            {stats.totalProducts}
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Total Sellers</p>
          <h2 className="text-2xl font-bold text-green-600">
            {stats.totalSellers}
          </h2>
        </div>

      </div>

      {/* CHART + PRODUCTS */}
      <div className="grid grid-cols-2 gap-8">

        {/* SALES CHART PLACEHOLDER */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Monthly Sales
          </h2>

          <div className="space-y-3">
            <div className="bg-green-200 h-4 w-1/3 rounded"></div>
            <div className="bg-green-300 h-4 w-1/2 rounded"></div>
            <div className="bg-green-400 h-4 w-2/3 rounded"></div>
            <div className="bg-green-500 h-4 w-3/4 rounded"></div>
          </div>
        </div>

        {/* TOP PRODUCTS */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Top Selling Products
          </h2>

          <ul className="space-y-4">
            {topProducts.map((product, index) => (
              <li
                key={index}
                className="flex justify-between border-b pb-2"
              >
                <span>{product.name}</span>
                <span className="text-green-600 font-semibold">
                  {product.sold} sold
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ORDER ANALYTICS */}
      <div className="bg-white rounded-lg shadow p-6 mt-10">
        <h2 className="text-xl font-semibold mb-6">
          Order Analytics
        </h2>

        <div className="grid grid-cols-4 gap-6 text-center">

          <div>
            <p className="text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.completed}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-red-500">
              {orders.cancelled}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Refunded</p>
            <p className="text-2xl font-bold text-yellow-500">
              {orders.refunded}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Disputed</p>
            <p className="text-2xl font-bold text-orange-500">
              {orders.disputed}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}