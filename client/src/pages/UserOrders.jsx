import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const UserOrders = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch Orders (FIXED)
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setError("Please login to view your orders");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/orders");

        console.log("Orders API:", response.data); // debug

        // ✅ Handle ALL response structures safely
        const resData = response.data;

        const orderData =
          resData?.data?.orders ||
          resData?.data ||
          resData?.orders ||
          resData;

        setOrders(Array.isArray(orderData) ? orderData : []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.error || "Error loading orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // ✅ Status Color (Dark Mode Supported)
  const getStatusColor = (status = "") => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  // 🔄 Loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ❌ Error
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // 📭 Empty Orders
  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 text-center transition">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          No Orders Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          You haven't placed any orders yet.
        </p>
        <Link
          to="/products"
          className="px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            View and track all your orders
          </p>
        </div>

        {/* Orders */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="p-6">
                {/* Top */}
                <div className="flex flex-col sm:flex-row justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #{order.orderNumber || order._id.slice(-6)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      order.status || order.orderStatus
                    )}`}
                  >
                    {order.status || order.orderStatus}
                  </span>
                </div>

                {/* Details */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid md:grid-cols-2 gap-6">
                  {/* Address */}
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-300 mb-2">
                      Shipping
                    </h3>
                    <p className="text-gray-900 dark:text-gray-100 text-sm">
                      {order?.shippingAddress?.street || "N/A"}
                      <br />
                      {order?.shippingAddress?.city || ""}
                    </p>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-300 mb-2">
                      Summary
                    </h3>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-300">
                          Items
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {order.items?.reduce(
                            (t, i) => t + i.quantity,
                            0
                          ) || 0}
                        </span>
                      </div>

                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500 dark:text-gray-300">
                          Total
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          $
                          {(
                            order.total ||
                            order.totalAmount ||
                            0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="mt-6 flex justify-end">
                  <Link
                    to={`/orders/${order._id}`}
                    className="px-4 py-2 text-sm rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserOrders;