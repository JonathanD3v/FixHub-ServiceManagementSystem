import React, { useEffect, useMemo, useState } from "react";
import { deleteMethod, getMethod, postMethod, putMethod } from "../services/index.jsx";
import { SUPPLIER_DETAIL_API, SUPPLIERS_API } from "../services/constant.js";
import toast from "react-hot-toast";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  isActive: true,
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const activeCount = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive !== false).length,
    [suppliers],
  );

  const inactiveCount = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive === false).length,
    [suppliers],
  );

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await getMethod(
        `${SUPPLIERS_API}?page=1&limit=200&search=${encodeURIComponent(searchQuery.trim())}`,
      );
      setSuppliers(response?.suppliers || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuppliers();
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedSupplier(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      isActive: supplier.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Name, email, and phone are required");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        isActive: formData.isActive,
      };

      if (selectedSupplier?._id) {
        await putMethod(SUPPLIER_DETAIL_API(selectedSupplier._id), payload);
        toast.success("Supplier updated");
      } else {
        await postMethod(SUPPLIERS_API, payload);
        toast.success("Supplier created");
      }

      setIsModalOpen(false);
      resetForm();
      await fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(error?.response?.data?.error || "Failed to save supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await deleteMethod(SUPPLIER_DETAIL_API(supplierId));
      toast.success("Supplier deleted");
      await fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Failed to delete supplier");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-indigo-100">Vendor Management</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Suppliers</h1>
            <p className="text-sm text-indigo-100/90 mt-1">
              Manage suppliers with a premium and modern workflow.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-xl bg-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/30 transition"
          >
            Add Supplier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{suppliers.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Active</p>
          <p className="text-2xl font-semibold text-emerald-800 mt-1">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-rose-700">Inactive</p>
          <p className="text-2xl font-semibold text-rose-800 mt-1">{inactiveCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search suppliers by name or email..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Supplier</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Contact</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Address</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{supplier.name}</p>
                      <p className="text-xs text-slate-500">{supplier.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{supplier.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{supplier.address || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          supplier.isActive !== false
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {supplier.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier._id)}
                          className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-sm text-slate-500">
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 px-6 py-4 text-white">
              <h2 className="text-xl font-semibold">
                {selectedSupplier ? "Edit Supplier" : "Create Supplier"}
              </h2>
              <p className="text-sm text-indigo-100 mt-1">
                Keep your vendor directory clean and professional.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Active supplier
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Saving..."
                    : selectedSupplier
                      ? "Update Supplier"
                      : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
