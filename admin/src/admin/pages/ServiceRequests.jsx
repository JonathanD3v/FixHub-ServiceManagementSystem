import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  assignServiceRequest,
  createServiceRequest,
  deleteServiceRequest,
  getAllServiceRequests,
  getPendingServiceRequests,
  updateServiceRequest,
} from "../services/serviceRequestService.js";
import DashboardPresenter from "../presenters/DashboardPresenter.js";
import { getMethod } from "../services/index.jsx";
import toast from "react-hot-toast";

const ServiceRequests = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [editingId, setEditingId] = useState(null);
  const prevPendingCount = useRef(0);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceType: "Phone",
    deviceBrand: "",
    deviceModel: "",
    issueDescription: "",
    assistedTechnicianId: "",
    laborCost: "",
    partsCost: "",
    paymentMethod: "",
    status: "pending",
  });
  const presenter = new DashboardPresenter({});
  const getStatusStyle = (status) => {
    if (status === "completed") return "bg-emerald-100 text-emerald-700";
    if (status === "assigned") return "bg-blue-100 text-blue-700";
    if (status === "in-progress") return "bg-amber-100 text-amber-700";
    if (status === "cancelled") return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  const loadData = async () => {
    const [requestsResponse, usersResponse, pendingResponse] = await Promise.all([
      getAllServiceRequests(),
      getMethod("/admin/users"),
      getPendingServiceRequests(),
    ]);
    setServiceRequests(requestsResponse?.data || []);
    setPendingRequests(
      pendingResponse?.data?.pendingRequests || pendingResponse?.pendingRequests || [],
    );
    const allUsers = usersResponse?.data?.users || [];
    setTechnicians(allUsers.filter((u) => u.role === "technician"));
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadData();
      } catch (error) {
        console.error("Error loading service requests page:", error);
        toast.error("Failed to load service requests data.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (loading) return;
    const count = pendingRequests.length;
    if (count > 0 && count !== prevPendingCount.current) {
      toast(`🔔 ${count} pending request${count > 1 ? "s" : ""} to assign`);
    }
    prevPendingCount.current = count;
  }, [pendingRequests, loading]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deviceType: "Phone",
      deviceBrand: "",
      deviceModel: "",
      issueDescription: "",
      assistedTechnicianId: "",
      laborCost: "",
      partsCost: "",
      paymentMethod: "",
      status: "pending",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      customerName: item.customerName || "",
      customerPhone: item.customerPhone || "",
      customerEmail: item.customerEmail || "",
      deviceType: item.deviceType || "Phone",
      deviceBrand: item.deviceBrand || "",
      deviceModel: item.deviceModel || "",
      issueDescription: item.issueDescription || "",
      assistedTechnicianId: item.assignedTo?._id || "",
      laborCost:
        item.laborCost !== undefined && item.laborCost !== null
          ? String(item.laborCost)
          : "",
      partsCost:
        item.partsCost !== undefined && item.partsCost !== null
          ? String(item.partsCost)
          : "",
      paymentMethod: item.paymentMethod || "",
      status: item.status || "pending",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.customerName ||
      !formData.customerPhone ||
      !formData.deviceType ||
      !formData.issueDescription
    ) {
      toast.error("Please fill required fields.");
      return;
    }
    try {
      const payload = {
        ...formData,
        laborCost:
          formData.laborCost === "" ? 0 : parseFloat(formData.laborCost) || 0,
        partsCost:
          formData.partsCost === "" ? 0 : parseFloat(formData.partsCost) || 0,
      };
      if (editingId) {
        await updateServiceRequest(editingId, payload);
        toast.success("Service request updated successfully.");
      } else {
        await createServiceRequest(payload);
        toast.success("Service request created successfully.");
      }
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save request.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service request?")) return;
    try {
      await deleteServiceRequest(id);
      toast.success("Service request deleted successfully.");
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete request.");
    }
  };

  const handleQuickAssign = async () => {
    if (!selectedRequest || !selectedTechnician) {
      toast.error("Please select a technician.");
      return;
    }
    try {
      await assignServiceRequest(selectedRequest._id, selectedTechnician);
      toast.success("Service request assigned successfully.");
      setShowAssignModal(false);
      setSelectedRequest(null);
      setSelectedTechnician("");
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to assign request.");
    }
  };

  const summary = useMemo(() => {
    const assigned = serviceRequests.filter((item) => item.status === "assigned").length;
    const completed = serviceRequests.filter(
      (item) => item.status === "completed",
    ).length;
    const revenue = serviceRequests.reduce(
      (sum, item) => sum + (item.totalAmount || 0),
      0,
    );
    return {
      total: serviceRequests.length,
      assigned,
      completed,
      pending: serviceRequests.filter((item) => item.status === "pending").length,
      revenue,
    };
  }, [serviceRequests]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white shadow-xl">
        <p className="text-sm text-blue-100">Service Desk</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">Service Requests</h1>
        <p className="mt-2 text-sm text-blue-100/90">
          Overview of your assigned and pending service requests.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Requests</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{summary.total}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-700">Assigned</p>
          <p className="text-2xl font-semibold text-blue-800 mt-1">{summary.assigned}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Completed</p>
          <p className="text-2xl font-semibold text-emerald-800 mt-1">{summary.completed}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">Pending Queue</p>
          <p className="text-2xl font-semibold text-amber-800 mt-1">{summary.pending}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70 p-4">
          <p className="text-xs uppercase tracking-wide text-violet-700">Total Value</p>
          <p className="text-2xl font-semibold text-violet-900 mt-1">
            {presenter.money(summary.revenue)}
          </p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/70 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Pending Requests to Assign
          </h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            {pendingRequests.length} Pending
          </span>
        </div>
        <div className="p-5">
          {pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.slice(0, 6).map((request) => (
                <div
                  key={request._id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-white transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{request.customerName}</p>
                      <p className="text-xs text-slate-500">{request.requestNumber}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      pending
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {request.deviceType}
                    {request.deviceBrand ? ` - ${request.deviceBrand}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {request.issueDescription}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setSelectedTechnician("");
                      setShowAssignModal(true);
                    }}
                    className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                  >
                    Assign Technician
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No pending requests to assign.</p>
          )}
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/70 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between bg-white">
          <h2 className="text-lg font-semibold text-slate-900">Service Requests</h2>
          <button
            onClick={openCreate}
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:shadow-md text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            + Add Request
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Request #</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Device</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Issue</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Technician</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned By</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {serviceRequests.length ? (
                serviceRequests.map((item) => (
                  <tr key={item._id}>
                    <td className="px-5 py-3 text-sm text-slate-900">{item.requestNumber}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{item.customerName}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">
                      {item.deviceType}
                      {item.deviceBrand ? ` - ${item.deviceBrand}` : ""}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">{item.issueDescription}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">
                      {item.assignedTo?.name || "Unassigned"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">
                      {presenter.money(item.totalAmount || 0)}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">
                      {item.assignedBy?.name || item.createdBy?.name || "N/A"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-5 py-6 text-center text-sm text-slate-500">
                    No service requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md p-4 sm:py-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
            <div className="px-5 py-4 sm:px-7 sm:py-6 bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {editingId ? "Edit Service Request" : "Create Service Request"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/20"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Customer
                  </h4>
                  <input
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Customer Name *"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                />
                <input
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Customer Phone *"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                />
                <input
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Customer Email"
                  value={formData.customerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, customerEmail: e.target.value })
                  }
                />
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Device & Assignment
                  </h4>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={formData.deviceType}
                  onChange={(e) =>
                    setFormData({ ...formData, deviceType: e.target.value })
                  }
                >
                  <option value="Phone">Phone</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Computer">Computer</option>
                  <option value="Other">Other</option>
                </select>
                <input
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Device Brand"
                  value={formData.deviceBrand}
                  onChange={(e) =>
                    setFormData({ ...formData, deviceBrand: e.target.value })
                  }
                />
                <input
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Device Model"
                  value={formData.deviceModel}
                  onChange={(e) =>
                    setFormData({ ...formData, deviceModel: e.target.value })
                  }
                />
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={formData.assistedTechnicianId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assistedTechnicianId: e.target.value,
                    })
                  }
                >
                  <option value="">No Technician</option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value })
                    }
                  >
                    <option value="">Payment Method (Optional)</option>
                    <option value="cash">cash</option>
                    <option value="card">card</option>
                    <option value="bank">bank</option>
                  </select>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="pending">pending</option>
                  <option value="assigned">assigned</option>
                  <option value="in-progress">in-progress</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Labor Cost
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="0.00"
                    value={formData.laborCost}
                    onChange={(e) =>
                      setFormData({ ...formData, laborCost: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Parts Cost
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="0.00"
                    value={formData.partsCost}
                    onChange={(e) =>
                      setFormData({ ...formData, partsCost: e.target.value })
                    }
                  />
                </div>
              </div>

              <textarea
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                rows="4"
                placeholder="Issue Description *"
                value={formData.issueDescription}
                onChange={(e) =>
                  setFormData({ ...formData, issueDescription: e.target.value })
                }
              />
              <p className="text-xs text-slate-500">
                Tip: Leave technician empty to keep request pending.
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:shadow-lg text-white font-semibold"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-semibold">Assign Technician</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm">
                <p className="text-slate-500">Request</p>
                <p className="font-semibold text-slate-900">
                  {selectedRequest?.requestNumber} - {selectedRequest?.customerName}
                </p>
              </div>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Technician</option>
                {technicians.map((tech) => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAssign}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequests;
