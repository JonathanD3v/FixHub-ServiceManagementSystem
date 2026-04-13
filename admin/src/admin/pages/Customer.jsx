import React, { useEffect, useMemo, useState } from "react";
import { getMethod, putMethod } from "../services/index.jsx";
import {
  CUSTOMERS_API,
  CUSTOMER_DETAIL_API,
  CUSTOMER_ORDERS_API,
} from "../services/constant.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DateTimeFormatter from "../utils/DateTimeFormatter.js";

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalCustomers = customers.length;
  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.isActive).length,
    [customers],
  );
  const inactiveCustomers = totalCustomers - activeCustomers;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getMethod(CUSTOMERS_API);
      setCustomers(res.data?.customers || res.data || []);
    } catch (err) {
      toast.error("Failed to fetch customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (customer) => {
    setEditCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
    });
    setAddress({
      street: customer.address?.street || "",
      city: customer.address?.city || "",
      state: customer.address?.state || "",
      country: customer.address?.country || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditCustomer(null);
    setFormData({ name: "", email: "", phone: "" });
    setAddress({ street: "", city: "", state: "", country: "" });
  };

  const closeOrdersModal = () => {
    setOrdersModalOpen(false);
    setSelectedCustomer(null);
    setOrders([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editCustomer?._id) return;

    try {
      await putMethod(CUSTOMER_DETAIL_API(editCustomer._id), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address,
      });
      toast.success("Customer updated");
      closeModal();
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update customer");
    }
  };

  const openOrdersModal = async (customer) => {
    setSelectedCustomer(customer);
    setOrdersModalOpen(true);
    setOrdersLoading(true);
    try {
      const res = await getMethod(CUSTOMER_ORDERS_API(customer._id));
      setOrders(res.data?.orders || res.data || []);
    } catch (err) {
      toast.error("Failed to fetch customer orders");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const customerAddress = (customer) =>
    [customer.address?.street, customer.address?.city, customer.address?.state, customer.address?.country]
      .filter(Boolean)
      .join(", ") || "N/A";

  return (
    <div className="space-y-6">
      <ToastContainer />

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
        <p className="text-sm text-indigo-100">Customer Management</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">Customers</h1>
        <p className="mt-2 text-sm text-indigo-100/90">
          Track customer profiles, contact info, and order history in one modern workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Customers</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalCustomers}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{activeCustomers}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-rose-700">Inactive</p>
          <p className="mt-1 text-2xl font-semibold text-rose-800">{inactiveCustomers}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.email}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{customer.phone || "N/A"}</td>
                      <td className="px-4 py-4 text-sm text-slate-700 max-w-[260px] truncate">
                        {customerAddress(customer)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            customer.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {DateTimeFormatter.formatDate(customer.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 transition"
                            onClick={() => openEditModal(customer)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 transition"
                            onClick={() => openOrdersModal(customer)}
                          >
                            Orders
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-sm text-slate-500">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-4 text-white">
              <h2 className="text-xl font-semibold">Edit Customer</h2>
              <p className="text-sm text-indigo-100 mt-1">
                Update contact and address details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Street</label>
                  <input
                    type="text"
                    name="street"
                    value={address.street}
                    onChange={handleAddressChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleAddressChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={address.country}
                    onChange={handleAddressChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ordersModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-indigo-600 px-6 py-4 text-white">
              <h2 className="text-xl font-semibold">{selectedCustomer?.name}'s Orders</h2>
              <p className="text-sm text-emerald-100 mt-1">
                Complete order history and delivery states.
              </p>
            </div>

            <div className="p-6">
              {ordersLoading ? (
                <div className="flex justify-center items-center h-36">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Order #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {order.orderNumber || order._id}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {DateTimeFormatter.formatDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            ${order.total?.toFixed(2) ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-1 font-medium capitalize">
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No orders found for this customer.
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeOrdersModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
