import React, { useState, useEffect } from "react";
import { getMethod, putMethod, postMethod } from "../services/index.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DateTimeFormatter from "../utils/DateTimeFormatter.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555/api";
const API_BASE_URL = API_URL.replace("/api", "");

// Helpers
const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
};

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [filter, setFilter] = useState("all");

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

  const getStatus = (o) => o.orderStatus || o.status || "pending";
  const getTotal = (o) => o.total || o.totalAmount || 0;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getMethod("/admin/orders");
      let data = res?.data?.orders || res.orders || [];

      // filter
      if (filter !== "all") {
        data = data.filter((o) => getStatus(o) === filter);
      }

      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await putMethod(`/admin/orders/${id}/status`, { status });
      fetchOrders();
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const handleRefund = async () => {
    try {
      await postMethod(`/admin/orders/${selectedOrder._id}/refund`, {
        reason: refundReason,
      });

      await putMethod(`/admin/orders/${selectedOrder._id}/status`, {
        status: "cancelled",
        paymentStatus: "refunded",
      });

      toast.success("Refund successful");
      setIsRefundModalOpen(false);
      setRefundReason("");
      fetchOrders();
    } catch {
      toast.error("Refund failed");
    }
  };

  const viewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const statusColor = (s) =>
    ({
      pending: "bg-yellow-100 text-yellow-700",
      processing: "bg-blue-100 text-blue-700",
      shipped: "bg-indigo-100 text-indigo-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    })[s] || "bg-gray-100 text-gray-700";

    const maxTotal = Math.max(...orders.map((o) => getTotal(o)), 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer theme="colored" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-5 rounded-xl shadow">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-gray-500">
            Manage and track all customer orders
          </p>
        </div>

        <div className="flex gap-3">

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All</option>
            {validStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* INSIGHTS */}
      <div className="bg-indigo-900 text-white rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Total Orders: {orders.length}</div>
          <div>
            Revenue: $
            {orders.reduce((sum, o) => sum + getTotal(o), 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* MINI CHART */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border">
  <div className="flex items-end gap-2 h-24">
    {orders.slice(0, 10).map((o, i) => {
      const height = (getTotal(o) / maxTotal) * 100;

      return (
        <div
          key={i}
          className="w-5 rounded-lg bg-gradient-to-t from-indigo-500 to-purple-500 hover:scale-105 transition-all"
          style={{ height: `${height}%` }}
          title={`$${getTotal(o).toFixed(2)}`}
        />
      );
    })}
  </div>
</div>

      {/* MODERN TABLE */}
<div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
  <div className="px-6 py-4 border-b flex justify-between items-center">
    <h2 className="text-lg font-semibold text-gray-800">
      Orders Overview
    </h2>
    <span className="text-sm text-gray-500">
      {orders.length} orders
    </span>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="text-xs uppercase text-gray-500 bg-gray-50">
          <th className="px-6 py-3 text-left">Order</th>
          <th className="px-6 py-3 text-left">Customer</th>
          <th className="px-6 py-3">Date</th>
          <th className="px-6 py-3">Total</th>
          <th className="px-6 py-3">Status</th>
          <th className="px-6 py-3 text-right">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y">
        {orders.map((o) => (
          <tr
            key={o._id}
            className="hover:bg-gray-50 transition-all duration-200"
          >
            {/* Order */}
            <td className="px-6 py-4">
              <div className="font-semibold text-gray-800">
                #{o.orderNumber}
              </div>
              <div className="text-xs text-gray-400">
                ID: {o._id.slice(-6)}
              </div>
            </td>

            {/* Customer */}
            <td className="px-6 py-4">
              <div className="font-medium text-gray-700">
                {o.user?.name || "Guest"}
              </div>
              <div className="text-xs text-gray-400">
                {o.user?.email}
              </div>
            </td>

            {/* Date */}
            <td className="px-6 py-4 text-center text-gray-600">
              {DateTimeFormatter.formatDate(o.createdAt)}
            </td>

            {/* Total */}
            <td className="px-6 py-4 text-center font-semibold text-gray-900">
              ${getTotal(o).toFixed(2)}
            </td>

            {/* Status */}
            <td className="px-6 py-4 text-center">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor(
                  getStatus(o),
                )}`}
              >
                {getStatus(o)}
              </span>
            </td>

            {/* Actions */}
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end items-center gap-2">
                
                {/* View */}
                <button
                  onClick={() => viewOrder(o)}
                  className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition"
                >
                  👁
                </button>

                {/* Refund */}
                <button
                  onClick={() => {
                    setSelectedOrder(o);
                    setIsRefundModalOpen(true);
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                >
                  💸
                </button>

                {/* Status Dropdown */}
                <select
                  value={getStatus(o)}
                  onChange={(e) =>
                    handleStatusChange(o._id, e.target.value)
                  }
                  className="text-xs border rounded-lg px-2 py-1 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                >
                  {validStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      {/* ORDER MODAL */}
{isModalOpen && selectedOrder && (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    
    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div>
          <h2 className="text-xl font-semibold">
            Order #{selectedOrder.orderNumber}
          </h2>
          <p className="text-sm text-indigo-100">
            {DateTimeFormatter.formatDateTime(selectedOrder.createdAt)}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(false)}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

        {/* TOP INFO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Customer */}
          <div className="bg-gray-50 p-4 rounded-xl border">
            <p className="text-xs text-gray-500 mb-1">Customer</p>
            <p className="font-semibold text-gray-800">
              {selectedOrder.user?.name || "Guest"}
            </p>
            <p className="text-sm text-gray-500">
              {selectedOrder.user?.email}
            </p>
          </div>

          {/* Status */}
          <div className="bg-gray-50 p-4 rounded-xl border">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span
              className={`px-3 py-1 text-xs rounded-full font-medium ${statusColor(
                getStatus(selectedOrder)
              )}`}
            >
              {getStatus(selectedOrder)}
            </span>
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-xl border text-right">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-xl font-bold text-gray-900">
              ${getTotal(selectedOrder).toFixed(2)}
            </p>
          </div>
        </div>

        {/* ITEMS */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Order Items
          </h3>

          <div className="space-y-3">
            {selectedOrder.items?.map((item, i) => {
              const p = item.productId || item.product;

              return (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-md transition bg-white"
                >
                  {/* IMAGE */}
                  {p?.images?.[0] && (
                    <img
                      src={getImageUrl(p.images[0])}
                      alt={p?.name}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  )}

                  {/* INFO */}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {p?.name || "Unknown Product"}
                    </p>

                    <div className="text-sm text-gray-500 mt-1">
                      Qty: {item.quantity}
                    </div>

                    <div className="text-xs text-gray-400">
                      Unit: ${toNumber(item.price).toFixed(2)}
                    </div>
                  </div>

                  {/* TOTAL */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      $
                      {(
                        toNumber(item.price) * toNumber(item.quantity)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUMMARY */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>${toNumber(selectedOrder.subtotal).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>${toNumber(selectedOrder.shippingCost).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span>${toNumber(selectedOrder.tax).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span>${getTotal(selectedOrder).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* REFUND MODAL */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="mb-4 font-semibold">Refund</h3>

            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full border rounded p-2"
            />

            <div className="flex justify-end mt-4 gap-3">
              <button onClick={() => setIsRefundModalOpen(false)}>
                Cancel
              </button>
              <button
                onClick={handleRefund}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;