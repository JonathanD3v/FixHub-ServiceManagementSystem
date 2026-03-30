import React, { useState, useEffect } from "react";
import { getMethod, putMethod, postMethod } from "../services/index.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555/api";
const API_BASE_URL = API_URL.replace("/api", "");

// Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [filter, setFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Valid order statuses from backend
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
  ];

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const normalizeResponse = (response) => {
    const r = response?.data || response || {};
    const orders = r.orders || r.data?.orders || [];
    const pagination = r.pagination ||
      r.data?.pagination || {
        page: 1,
        limit: 10,
        total: orders.length,
        pages: 1,
      };

    return { orders, pagination };
  };

  const getOrderStatus = (order) =>
    order.orderStatus || order.status || "pending";
  const getOrderTotal = (order) =>
    order.total || order.totalAmount || order.subtotal || 0;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getMethod("/admin/orders");
      const { orders: ordersData, pagination: paginationData } =
        normalizeResponse(response);

      let filteredOrders = ordersData;
      if (filter !== "all") {
        filteredOrders = ordersData.filter(
          (order) => getOrderStatus(order) === filter,
        );
      }

      setOrders(filteredOrders);
      setPagination({
        ...paginationData,
        total: paginationData.total || filteredOrders.length,
      });
    } catch (error) {
      toast.error("Error fetching orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      let paymentStatus;

      // Determine payment status based on order status
      if (newStatus === "completed" || newStatus === "delivered") {
        paymentStatus = "paid";
      } else if (newStatus === "pending") {
        paymentStatus = "pending";
      } else {
        paymentStatus = undefined; // Keep existing payment status for other statuses
      }

      // Prepare the update data
      const updateData = {
        status: newStatus,
        paymentStatus: paymentStatus,
      };

      // Make a single request to update both status and payment status
      const response = await putMethod(
        `/admin/orders/${orderId}/status`,
        updateData,
      );

      if (response.status === "success" && response.data?.order) {
        const updated = response.data.order;
        updated.status = updated.orderStatus || updated.status;
        updated.total = updated.totalAmount || updated.total;

        // Update the order in the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order._id === orderId ? updated : order)),
        );
        toast.success("Order status updated successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else {
        toast.error("Failed to update order status", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    } catch (error) {
      // console.error('Error updating order status:', error);
      const errorMessage =
        error.response?.data?.message || "Error updating order status";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  const handleRefund = async (orderId) => {
    try {
      // First process the refund
      const response = await postMethod(`/admin/orders/${orderId}/refund`, {
        reason: refundReason,
      });

      if (response.status === "success") {
        // Then update the payment status to refunded
        const updateResponse = await putMethod(
          `/admin/orders/${orderId}/status`,
          {
            status: "cancelled",
            paymentStatus: "refunded",
          },
        );

        if (updateResponse.status === "success" && updateResponse.data?.order) {
          const updated = updateResponse.data.order;
          updated.status = updated.orderStatus || updated.status;
          updated.total = updated.totalAmount || updated.total;

          // Update the order in the local state
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order._id === orderId ? updated : order,
            ),
          );

          toast.success("Refund processed successfully", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });

          setIsRefundModalOpen(false);
          setRefundReason("");
        } else {
          toast.error("Failed to update order status after refund", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
        }
      } else {
        toast.error("Failed to process refund", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      const errorMessage =
        error.response?.data?.message || "Error processing refund";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  const viewOrderDetails = async (order) => {
    try {
      setLoading(true);
      let selected = order;

      // Fetch detailed order info, fallback to passed order object.
      try {
        const response = await getMethod(`/admin/orders/${order._id}`);
        const orderData = response?.data?.order || response?.order || response;
        selected = {
          ...orderData,
          user: orderData.user || order.user || order.data?.user,
          shippingAddress:
            orderData.shippingAddress ||
            orderData.customerAddress ||
            order.shippingAddress ||
            order.customerAddress ||
            {},
        };
      } catch (error) {
        console.warn(
          "Could not fetch order details, using local order object",
          error,
        );
      }

      const normalizedOrder = {
        ...selected,
        status: getOrderStatus(selected),
        total: getOrderTotal(selected),
      };

      setSelectedOrder(normalizedOrder);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Error loading order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Orders</option>
            {validStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.user?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${getOrderTotal(order).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getOrderStatus(order))}`}
                      >
                        {getOrderStatus(order).charAt(0).toUpperCase() +
                          getOrderStatus(order).slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.paymentMethod}
                      </div>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors duration-200"
                      >
                        View
                      </button>
                      <select
                        value={getOrderStatus(order)}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                        disabled={getOrderStatus(order) === "cancelled"}
                      >
                        {validStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      {order.status !== "cancelled" && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsRefundModalOpen(true);
                          }}
                          className="ml-4 text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Details
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Order Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    Order Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">
                      {selectedOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(getOrderStatus(selectedOrder))}`}
                    >
                      {getOrderStatus(selectedOrder).charAt(0).toUpperCase() +
                        getOrderStatus(selectedOrder).slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {selectedOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                  {selectedOrder.paymentDetails && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">
                        Payment Details
                      </div>
                      <div className="text-sm text-gray-700">
                        Cardholder:{" "}
                        {selectedOrder.paymentDetails.cardHolder || "-"}
                      </div>
                      <div className="text-sm text-gray-700">
                        Card Ending:{" "}
                        {selectedOrder.paymentDetails.cardNumber || "-"}
                      </div>
                      <div className="text-sm text-gray-700">
                        Expiration:{" "}
                        {selectedOrder.paymentDetails.expirationDate || "-"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    Customer Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {selectedOrder.user?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {selectedOrder.user?.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    Shipping Address
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingAddress?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingAddress?.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingAddress?.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium text-right">
                      {selectedOrder.shippingAddress?.street}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">City:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingAddress?.city}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">State:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingAddress?.state}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ZIP:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingAddress?.zipCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingAddress?.country}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items - Payment Slip Style */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    Payment Receipt
                  </h3>
                  <div className="text-white text-sm">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-2 text-gray-300 text-sm">
                  Order #{selectedOrder.orderNumber}
                </div>
              </div>

              <div className="p-6">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 mb-2">
                    <div>Item</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Quantity</div>
                    <div className="text-right">Total</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-4 items-center"
                    >
                      <div className="flex items-center space-x-4">
                        {item.product?.images?.[0] && (
                          <img
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.product?.name}
                          </div>
                          {item.product?.description && (
                            <div className="text-sm text-gray-500">
                              {item.product.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-gray-900">
                        ${item.price.toFixed(2)}
                      </div>
                      <div className="text-right text-gray-900">
                        {item.quantity}
                      </div>
                      <div className="text-right font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      ${selectedOrder.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      ${selectedOrder.shippingCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">
                      ${selectedOrder.tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${getOrderTotal(selectedOrder).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Payment Status:{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}
                      >
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Payment Method: {selectedOrder.paymentMethod}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Process Refund</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Refund Reason
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsRefundModalOpen(false);
                    setRefundReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRefund(selectedOrder._id)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
