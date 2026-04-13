import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMethod } from "../services/index.jsx";
import DashboardPresenter from "../presenters/DashboardPresenter.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555/api";
const API_BASE_URL = API_URL.replace("/api", "");

// Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    sales: { today: { total: 0, count: 0 }, monthly: { total: 0, count: 0 } },
    products: { total: 0, lowStock: 0 },
    orders: { total: 0 },
    topProducts: [],
    customerStats: [],
    lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [serviceSummary, setServiceSummary] = useState({
    pendingServiceRequests: 0,
    assignedServiceRequests: 0,
    completedServiceRequests: 0,
    totalServiceRevenue: 0,
  });
  const presenter = new DashboardPresenter(stats);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, staffSummaryResponse] = await Promise.all([
          getMethod("/admin/dashboard/stats"),
          getMethod("/admin/staff/dashboard"),
        ]);
        setStats(dashboardResponse);
        setServiceSummary(staffSummaryResponse?.data || {});
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl">
        <p className="text-sm text-indigo-100">Welcome back</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">
          {user?.name ? `${user.name}'s Dashboard` : "Admin Dashboard"}
        </h1>
        <p className="mt-2 text-sm text-indigo-100/90">
          Track sales, inventory, and store performance in one place.
        </p>
        <p className="mt-2 text-xs text-indigo-200/90">
          Timezone: {stats?.timezone || "Asia/Yangon"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Today's Sales
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {presenter.money(stats.sales.today.total)}
                  </dd>
                  <dd className="text-sm text-slate-500">
                    {stats.sales.today.count} orders
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Sales */}
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Monthly Sales
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {presenter.money(stats.sales.monthly.total)}
                  </dd>
                  <dd className="text-sm text-slate-500">
                    {stats.sales.monthly.count} orders
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Products */}
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Total Products
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {stats.products.total}
                  </dd>
                  <dd className="text-sm text-red-500">
                    {stats.products.lowStock} low stock
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-indigo-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Total Orders (All Time)
                  </dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {stats.orders.total}
                  </dd>
                  <dd className="text-sm text-indigo-500">
                    Avg order: {presenter.money(presenter.averageOrderValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Request Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <p className="text-sm font-medium text-slate-500">Pending Service Requests</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {serviceSummary.pendingServiceRequests || 0}
            </p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <p className="text-sm font-medium text-slate-500">Assigned Service Requests</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {serviceSummary.assignedServiceRequests || 0}
            </p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <p className="text-sm font-medium text-slate-500">Completed Service Requests</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {serviceSummary.completedServiceRequests || 0}
            </p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-slate-200/70">
          <div className="p-5">
            <p className="text-sm font-medium text-slate-500">Service Revenue</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {presenter.money(serviceSummary.totalServiceRevenue || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Exam-friendly insight facts */}
      <div className="bg-slate-900 rounded-2xl p-6 text-slate-100 shadow-xl">
        <h3 className="text-lg font-semibold">Business Insights & Facts</h3>
        <p className="text-sm text-slate-300 mt-1">
          Auto-calculated indicators to support data-driven decisions.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {presenter.facts.map((fact, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm"
            >
              {fact}
            </div>
          ))}
        </div>
      </div>

      {/* Top Products and Low Stock Alerts Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top Products */}
        <div className="bg-white shadow-lg rounded-xl border border-slate-200/70">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-semibold text-slate-900">
              Top Selling Products
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {stats.topProducts.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {stats.topProducts.map((product) => (
                      <li key={product._id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={getImageUrl(product.product.images[0])}
                              alt={product.product.name}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {product.product.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              Sold: {product.totalSold} units
                            </p>
                          </div>
                          <div className="text-sm font-medium text-emerald-600">
                            {presenter.money(product.totalRevenue)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No products sold yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white shadow-lg rounded-xl border border-slate-200/70">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-semibold text-slate-900">
              Low Stock Alerts
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {stats.lowStockProducts.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {stats.lowStockProducts.map((product) => (
                      <li key={product._id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={getImageUrl(product.images?.[0])}
                              alt={product.name}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {product.name}
                            </p>
                          </div>
                          <div className="text-sm text-red-500 font-medium">
                            {product.stock} units left
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No low stock alerts.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
