import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMethod } from "../services/index.jsx";
import {
  createServiceRequest,
  assignServiceRequest,
  getPendingServiceRequests,
  getStaffDashboardStats,
  getServices,
} from "../services/serviceRequestService.js";
import DashboardPresenter from "../presenters/DashboardPresenter.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555/api";
const API_BASE_URL = API_URL.replace("/api", "");

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    orders: [],
    pendingServiceRequests: 0,
    assignedServiceRequests: 0,
    completedServiceRequests: 0,
    totalServiceRevenue: 0,
    serviceRequests: [],
    performanceData: [],
  });
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    issueDescription: "",
    assistedTechnicianId: "",
    paymentMethod: "",
    laborCost: "",
    partsCost: "",
    serviceId: "",
    serviceName: "",
    servicePrice: "",
    estimatedTime: "",
  });
  const presenter = new DashboardPresenter(stats);

  const normalizeStats = (response) => {
    const payload = response?.data || response || {};
    return {
      assignedOrders: payload.assignedOrders || 0,
      deliveredOrders: payload.deliveredOrders || payload.completedOrders || 0,
      pendingOrders: payload.pendingOrders || 0,
      totalRevenue: payload.totalRevenue || 0,
      orders: payload.orders || [],
      pendingServiceRequests: payload.pendingServiceRequests || 0,
      assignedServiceRequests: payload.assignedServiceRequests || 0,
      completedServiceRequests: payload.completedServiceRequests || 0,
      totalServiceRevenue: payload.totalServiceRevenue || 0,
      serviceRequests: payload.serviceRequests || [],
      performanceData: payload.performanceData || [],
    };
  };

  const getPendingList = (response) =>
    response?.data?.pendingRequests || response?.pendingRequests || [];

  const fetchStaffDashboard = async () => {
    const response = await getStaffDashboardStats();
    setStats(normalizeStats(response));
  };

  const fetchPendingRequests = async () => {
    const response = await getPendingServiceRequests();
    setPendingRequests(getPendingList(response));
  };

  const deliveredOrdersCount = stats.orders.filter(
    (order) => order.orderStatus === "delivered",
  ).length;
  const pendingOrdersCount = stats.orders.filter((order) =>
    ["pending", "processing", "shipped"].includes(order.orderStatus),
  ).length;
  const assignedServiceCount = stats.serviceRequests.filter(
    (request) => request.status === "assigned",
  ).length;
  const completedServiceCount = stats.serviceRequests.filter(
    (request) => request.status === "completed",
  ).length;

  // Fetch dashboard stats
  useEffect(() => {
    const initDashboard = async () => {
      try {
        await fetchStaffDashboard();
      } catch (error) {
        console.error("Error fetching staff dashboard data:", error);
        setErrorMessage("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  // Fetch pending requests
  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingRequests().catch((error) => {
        console.error("Error fetching pending requests:", error);
      });
    }
  }, [activeTab]);

  // Fetch technicians on mount
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await getMethod("/admin/users");
        // Response structure: { status: "success", data: { users: [...], pagination: {...} } }
        const allUsers = response.data?.users || [];
        const technicianList = allUsers.filter((u) => u.role === "technician");
        setTechnicians(technicianList);
      } catch (error) {
        console.error("Error fetching technicians:", error);
        setTechnicians([]);
      }
    };

    fetchTechnicians();
  }, []);

  // Fetch services on component mount
  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        const servicesResponse = await getServices();
        console.log("Services API Response:", servicesResponse);

        // Handle different response structures
        let servicesList = [];
        if (Array.isArray(servicesResponse)) {
          servicesList = servicesResponse;
        } else if (servicesResponse?.data) {
          if (Array.isArray(servicesResponse.data)) {
            servicesList = servicesResponse.data;
          } else if (Array.isArray(servicesResponse.data?.services)) {
            servicesList = servicesResponse.data.services;
          }
        }

        console.log("Processed Services List:", servicesList);
        setServices(servicesList);
      } catch (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      }
    };

    fetchServicesData();
  }, []);

  // Handle assign request
  const handleAssignRequest = async () => {
    if (!selectedRequest || !selectedTechnician) {
      setErrorMessage("Please select both a request and a technician");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await assignServiceRequest(
        selectedRequest._id,
        selectedTechnician,
      );

      setSuccessMessage("Service request assigned successfully!");
      setTimeout(() => {
        setSuccessMessage("");
        setShowAssignModal(false);
        setSelectedRequest(null);
        setSelectedTechnician("");
        // Refresh pending requests
        fetchPendingRequests().catch((error) => {
          console.error("Error refreshing pending requests:", error);
        });
        // Refresh dashboard stats
        fetchStaffDashboard().catch((error) => {
          console.error("Error refreshing staff dashboard:", error);
        });
      }, 2000);
    } catch (error) {
      console.error("Error assigning request:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to assign request",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle create service request
  const handleCreateRequest = async (e) => {
    e.preventDefault();

    if (
      !formData.customerName ||
      !formData.customerPhone ||
      !formData.deviceType ||
      !formData.issueDescription ||
      !formData.serviceId
    ) {
      setErrorMessage(
        "Please fill in all required fields including service selection",
      );
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        deviceType: formData.deviceType,
        deviceBrand: formData.deviceBrand,
        deviceModel: formData.deviceModel,
        issueDescription: formData.issueDescription,
        serviceId: formData.serviceId,
        serviceName: formData.serviceName,
        servicePrice: formData.servicePrice,
        estimatedTime: formData.estimatedTime,
        laborCost:
          formData.laborCost === "" ? 0 : parseFloat(formData.laborCost) || 0,
        partsCost:
          formData.partsCost === "" ? 0 : parseFloat(formData.partsCost) || 0,
        paymentMethod: formData.paymentMethod,
        assistedTechnicianId: formData.assistedTechnicianId || undefined,
      };
      const response = await createServiceRequest(payload);

      setSuccessMessage(
        response?.message ||
          "Service request created successfully and pending assignment!",
      );
      setTimeout(() => {
        setSuccessMessage("");
        setShowCreateModal(false);
        setFormData({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          deviceType: "",
          deviceBrand: "",
          deviceModel: "",
          issueDescription: "",
          assistedTechnicianId: "",
          paymentMethod: "",
          laborCost: "",
          partsCost: "",
          serviceId: "",
          serviceName: "",
          servicePrice: "",
          estimatedTime: "",
        });
        // Refresh dashboard stats
        fetchStaffDashboard().catch((error) => {
          console.error("Error refreshing staff dashboard:", error);
        });
      }, 2000);
    } catch (error) {
      console.error("Error creating request:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to create request",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Handle service selection
  const handleServiceChange = (serviceId) => {
    const selectedService = services.find((s) => s._id === serviceId);
    if (selectedService) {
      setFormData({
        ...formData,
        serviceId: serviceId,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        estimatedTime: selectedService.estimatedTime,
      });
    } else {
      setFormData({
        ...formData,
        serviceId: "",
        serviceName: "",
        servicePrice: "",
        estimatedTime: "",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white shadow-xl">
        <p className="text-sm text-blue-100">Welcome</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">
          {user?.name ? `${user.name}'s Dashboard` : "Staff Dashboard"}
        </h1>
        <p className="mt-2 text-sm text-blue-100/90">
          Manage your assigned orders, track performance, and handle service
          requests.
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✓ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ✕ {errorMessage}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Delivered Orders */}
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Delivered Orders
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {stats.deliveredOrders}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Service Requests */}
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-amber-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Pending Service Requests
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {stats.pendingServiceRequests}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Service Requests */}
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-orange-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Service Requests Assigned
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {stats.assignedServiceRequests}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/70">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "orders"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab("service")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "service"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            My Service Requests
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-medium text-sm relative ${
              activeTab === "pending"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Pending Requests
            {stats.pendingServiceRequests > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {stats.pendingServiceRequests}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {activeTab === "orders" && (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Total My Orders</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {stats.orders.length}
                  </p>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-xs text-green-700">Completed</p>
                  <p className="text-xl font-semibold text-green-800">
                    {deliveredOrdersCount}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs text-amber-700">Open Orders</p>
                  <p className="text-xl font-semibold text-amber-800">
                    {pendingOrdersCount}
                  </p>
                </div>
              </>
            )}
            {activeTab === "service" && (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Total Service Requests
                  </p>
                  <p className="text-xl font-semibold text-slate-900">
                    {stats.serviceRequests.length}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-xs text-blue-700">Assigned</p>
                  <p className="text-xl font-semibold text-blue-800">
                    {assignedServiceCount}
                  </p>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-xs text-green-700">Completed</p>
                  <p className="text-xl font-semibold text-green-800">
                    {completedServiceCount}
                  </p>
                </div>
              </>
            )}
            {activeTab === "pending" && (
              <>
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs text-red-700">Pending to Assign</p>
                  <p className="text-xl font-semibold text-red-800">
                    {pendingRequests.length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Estimated Queue Value
                  </p>
                  <p className="text-xl font-semibold text-slate-900">
                    {presenter.money(
                      pendingRequests.reduce(
                        (acc, request) => acc + (request.totalAmount || 0),
                        0,
                      ),
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                  <p className="text-xs text-cyan-700">Ready to Assign</p>
                  <p className="text-xl font-semibold text-cyan-800">
                    {
                      pendingRequests.filter(
                        (request) =>
                          !request.assignedTo && request.status === "pending",
                      ).length
                    }
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Recent Orders
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {stats.orders && stats.orders.length > 0 ? (
                      stats.orders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            #{order._id?.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {order.customerName || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                            {presenter.money(order.totalAmount || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.orderStatus === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.orderStatus === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {order.orderStatus || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-4 text-center text-sm text-slate-500"
                        >
                          No orders assigned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Service Requests Tab */}
          {activeTab === "service" && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Service Requests Assigned by You
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Request #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Technician
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Assigned By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {stats.serviceRequests &&
                    stats.serviceRequests.length > 0 ? (
                      stats.serviceRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {request.requestNumber || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {request.customerName || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {request.deviceType || "N/A"}
                            {request.deviceBrand
                              ? ` - ${request.deviceBrand}`
                              : ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {request.assignedTo?.name || "Unassigned"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {request.assignedBy?.name ||
                              request.createdBy?.name ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                            {presenter.money(request.totalAmount || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-700 capitalize">
                              {request.paymentStatus || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                request.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : request.status === "assigned"
                                    ? "bg-blue-100 text-blue-800"
                                    : request.status === "in-progress"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {request.status || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="px-6 py-4 text-center text-sm text-slate-500"
                        >
                          No service requests assigned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Requests Tab */}
          {activeTab === "pending" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Pending Service Requests to Assign
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setFormData({
                      customerName: "",
                      customerPhone: "",
                      customerEmail: "",
                      deviceType: "",
                      deviceBrand: "",
                      deviceModel: "",
                      issueDescription: "",
                      assistedTechnicianId: "",
                      paymentMethod: "",
                      laborCost: "",
                      partsCost: "",
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition"
                >
                  + Create Service Request
                </button>
              </div>
              {pendingRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50/30 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {request.customerName}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Request: {request.requestNumber}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === "assigned"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {request.status || "pending"}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="text-sm">
                          <span className="text-slate-600">Device:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {request.deviceType}
                            {request.deviceBrand
                              ? ` - ${request.deviceBrand}`
                              : ""}
                            {request.deviceModel
                              ? ` ${request.deviceModel}`
                              : ""}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-600">Issue:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {request.issueDescription?.substring(0, 50)}
                            {request.issueDescription?.length > 50 ? "..." : ""}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-600">Amount:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {presenter.money(request.totalAmount || 0)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowAssignModal(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                      >
                        Assign to Technician
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">
                    No pending service requests to assign.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6-9H9"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Assign Service Request
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedRequest(null);
                    setSelectedTechnician("");
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
            </div>

            {/* Content */}
            {selectedRequest && (
              <div className="p-6 space-y-6">
                {/* Service Request Details */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                    Request Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
                        Customer
                      </p>
                      <p className="text-base font-semibold text-slate-900 mt-1">
                        {selectedRequest.customerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
                        Request #
                      </p>
                      <p className="text-base font-semibold text-slate-900 mt-1">
                        {selectedRequest.requestNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
                        Device
                      </p>
                      <p className="text-base font-semibold text-slate-900 mt-1">
                        {selectedRequest.deviceType}
                        {selectedRequest.deviceBrand &&
                          ` - ${selectedRequest.deviceBrand}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
                        Amount
                      </p>
                      <p className="text-base font-semibold text-slate-900 mt-1">
                        {presenter.money(selectedRequest.totalAmount || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
                      Issue Description
                    </p>
                    <p className="text-sm text-slate-800 mt-1 leading-relaxed">
                      {selectedRequest.issueDescription}
                    </p>
                  </div>
                </div>

                {/* Technician Selection */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                      Select Technician *
                    </h3>
                    {technicians.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {technicians.length} Available
                      </span>
                    )}
                  </div>

                  {technicians.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                      {technicians.map((tech) => (
                        <div
                          key={tech._id}
                          onClick={() => setSelectedTechnician(tech._id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            selectedTechnician === tech._id
                              ? "border-blue-600 bg-blue-50 shadow-md"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedTechnician === tech._id
                                  ? "bg-blue-600"
                                  : "bg-slate-200"
                              }`}
                            >
                              <svg
                                className={`w-5 h-5 ${
                                  selectedTechnician === tech._id
                                    ? "text-white"
                                    : "text-slate-600"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {tech.name}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Technician
                              </p>
                              {tech.email && (
                                <p className="text-xs text-slate-500 mt-1 truncate">
                                  {tech.email}
                                </p>
                              )}
                              {tech.phone && (
                                <p className="text-xs text-slate-500 truncate">
                                  {tech.phone}
                                </p>
                              )}
                            </div>
                            {selectedTechnician === tech._id && (
                              <div className="flex-shrink-0 text-blue-600">
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                      <svg
                        className="w-12 h-12 text-slate-300 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      <p className="text-slate-600 font-medium">
                        No technicians available
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        Please create technician accounts first
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedRequest(null);
                      setSelectedTechnician("");
                    }}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignRequest}
                    disabled={isAssigning || !selectedTechnician}
                    className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      isAssigning || !selectedTechnician
                        ? "bg-blue-300 text-blue-100 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white"
                    }`}
                  >
                    {isAssigning ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Assign Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Service Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4 sm:py-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
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
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Create Service Request
                    </h2>
                    <p className="text-sm text-emerald-50/90">
                      Capture details and assign to a technician.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/20 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
            </div>

            <div className="p-6">
              <div className="mb-5 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 text-sm text-cyan-900">
                Fields with <span className="font-semibold">*</span> are
                required.
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-5">
                {/* Customer Information */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A8.962 8.962 0 0112 15c2.252 0 4.31.833 5.879 2.204M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerPhone: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerEmail: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Device Information */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M7 3h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                      />
                    </svg>
                    Device Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Device Type *
                      </label>
                      <select
                        value={formData.deviceType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deviceType: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">-- Select Device Type --</option>
                        <option value="Phone">Phone</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Computer">Computer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.deviceBrand}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deviceBrand: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Apple, Samsung, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={formData.deviceModel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deviceModel: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="iPhone 14, Galaxy S23, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                    Service Type *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Select Service *
                      </label>
                      <select
                        value={formData.serviceId}
                        onChange={(e) => handleServiceChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">-- Select a Service --</option>
                        {services.map((service) => (
                          <option key={service._id} value={service._id}>
                            {service.name} - {service.category} (
                            {service.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.serviceId && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Service Price
                          </label>
                          <input
                            type="text"
                            value={`${formData.servicePrice ? formData.servicePrice.toFixed(2) : "0.00"}`}
                            disabled
                            className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Est. Time (minutes)
                          </label>
                          <input
                            type="text"
                            value={formData.estimatedTime || "0"}
                            disabled
                            className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 cursor-not-allowed"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Issue Description */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h8M8 14h5M5 4h14a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z"
                      />
                    </svg>
                    Issue Details
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Issue Description *
                    </label>
                    <textarea
                      value={formData.issueDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          issueDescription: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Describe the issue or problem..."
                      rows="4"
                    />
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-violet-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Labor Cost
                      </label>
                      <input
                        type="number"
                        value={formData.laborCost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            laborCost: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Parts Cost
                      </label>
                      <input
                        type="number"
                        value={formData.partsCost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partsCost: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethod: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">-- Select Payment Method --</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Technician Assignment */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-8 0v2m8 0H9m4-8a3 3 0 110-6 3 3 0 010 6z"
                      />
                    </svg>
                    Assign Technician
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Select Technician (Optional)
                    </label>
                    <select
                      value={formData.assistedTechnicianId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assistedTechnicianId: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">-- Choose a technician --</option>
                      {technicians.map((tech) => (
                        <option key={tech._id} value={tech._id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg disabled:from-emerald-400 disabled:to-teal-400 text-white font-semibold py-2.5 rounded-lg transition"
                  >
                    {isCreating ? "Creating..." : "Create & Assign"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
