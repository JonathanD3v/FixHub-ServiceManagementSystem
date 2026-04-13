import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMethod } from "../services/index.jsx";
import DashboardPresenter from "../presenters/DashboardPresenter.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555/api";
const API_BASE_URL = API_URL.replace("/api", "");

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedServices: 0,
    completedServices: 0,
    inProgressServices: 0,
    totalServiceRevenue: 0,
    services: [],
    performanceMetrics: [],
  });
  const [loading, setLoading] = useState(true);
  const presenter = new DashboardPresenter(stats);

  useEffect(() => {
    const fetchTechnicianDashboard = async () => {
      try {
        const response = await getMethod("/admin/technician/dashboard");
        setStats(response?.data || response);
      } catch (error) {
        console.error("Error fetching technician dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 p-6 text-white shadow-xl">
        <p className="text-sm text-orange-100">Welcome</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">
          {user?.name ? `${user.name}'s Dashboard` : "Technician Dashboard"}
        </h1>
        <p className="mt-2 text-sm text-orange-100/90">
          Track your service requests and repair work progress.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Assigned Services */}
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Assigned Services
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {stats.assignedServices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-400"
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
                    In Progress
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {stats.inProgressServices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Services */}
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
                    Completed
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {stats.completedServices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Service Revenue */}
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-purple-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Revenue Generated
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {presenter.money(stats.totalServiceRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Requests */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/70 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            My Service Requests
          </h2>
          <a
            href="/admin/service-requests"
            className="text-orange-600 hover:text-orange-800 font-medium text-sm"
          >
            View All →
          </a>
        </div>

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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {stats.services && stats.services.length > 0 ? (
                stats.services.slice(0, 5).map((service) => (
                  <tr key={service._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      #{service._id?.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {service.customerName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {service.deviceModel || service.deviceType || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          service.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : service.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : service.status === "assigned"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {service.status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(service.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
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

      {/* Performance Metrics */}
      {stats.performanceMetrics && stats.performanceMetrics.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/70 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Performance Overview
            </h2>
            <div className="space-y-3">
              {stats.performanceMetrics.map((metric, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{metric.label}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
