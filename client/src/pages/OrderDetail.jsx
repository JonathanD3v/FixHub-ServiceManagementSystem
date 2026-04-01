import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/formatters";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user) {
        setError("Please login to view order details");
        setLoading(false);
        return;
      }

      try {
        if (!id || id.length !== 24) {
          setError("Invalid order ID format");
          setLoading(false);
          return;
        }

        const response = await api.get(`/orders/${id}`);
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.error || "Error loading order details");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-gray-500 dark:text-gray-300">
          Order not found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8 transition-colors duration-300">
      <div className="container mx-auto px-4">
        {/* Back */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            ← Back to Orders
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-300">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Order #{order._id.slice(-6).toUpperCase()}
                </h1>
                <p className="text-gray-500 dark:text-gray-300 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  order.status || order.orderStatus
                )}`}
              >
                {order.status || order.orderStatus}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Order Items
            </h2>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center py-4 border-b border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={getImageUrl(item.product.images[0])}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />

                  <div className="ml-6 flex-grow">
                    <Link
                      to={`/products/${item.product._id}`}
                      className="text-lg font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      ${item.product.price.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Order Summary
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-300">
                  Subtotal
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  $
                  {(
                    order.subtotal ||
                    order.total ||
                    order.totalAmount ||
                    0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-300">
                  Shipping
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Free
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 flex justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Total
                </span>
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  ${(order.total || order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Shipping Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  Address
                </h3>
                <p className="mt-2 text-gray-900 dark:text-gray-100">
                  {(order.shippingAddress || {}).street || "N/A"}
                  <br />
                  {(order.shippingAddress || {}).city || ""}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  Contact
                </h3>
                <p className="mt-2 text-gray-900 dark:text-gray-100">
                  {order.customerName || order.shippingAddress?.name || ""}
                  <br />
                  {order.customerEmail || order.shippingAddress?.email || ""}
                  <br />
                  {order.customerPhone || order.shippingAddress?.phone || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;