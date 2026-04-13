import React, { useEffect, useMemo, useState } from "react";
import { getMethod } from "../services/index.jsx";
import { REPORTS_DATA_API } from "../services/constant.js";
import toast from "react-hot-toast";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const toLabel = (item, type) => {
  if (type === "sales" || type === "daily_sales") {
    const year = item?._id?.year;
    const month = item?._id?.month;
    const day = item?._id?.day;
    if (year && month && day) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  if (type === "weekly_sales") {
    const year = item?._id?.year;
    const week = item?._id?.week;
    if (year && week) return `W${String(week).padStart(2, "0")} ${year}`;
  }
  if (type === "monthly_sales") {
    const year = item?._id?.year;
    const month = item?._id?.month;
    if (year && month) return `${year}-${String(month).padStart(2, "0")}`;
  }
  if (type === "products") return item?.product?.name || "Unknown";
  if (type === "customers") return item?.customer?.name || "Unknown";
  if (type === "services" || type === "service_popularity")
    return item?._id || "General Service";
  if (type === "technician_performance") return item?.technician?.name || "Unknown";
  if (typeof item?._id === "string" || typeof item?._id === "number") {
    return String(item._id);
  }
  if (item?._id && typeof item._id === "object") {
    const year = item._id.year;
    const month = item._id.month;
    const day = item._id.day;
    if (year && month && day) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return JSON.stringify(item._id);
  }
  return "N/A";
};

const SimpleLineChart = ({ labels, values }) => {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-md p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Revenue Trend</p>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
          Live range
        </span>
      </div>
      <div className="h-60 w-full rounded-2xl bg-gradient-to-b from-indigo-50/80 to-white p-3">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="reportArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map((line) => (
            <line
              key={line}
              x1="0"
              y1={line}
              x2="100"
              y2={line}
              stroke="#e2e8f0"
              strokeWidth="0.4"
            />
          ))}
          <polygon points={areaPoints} fill="url(#reportArea)" />
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.2"
            points={points}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {values.map((value, idx) => {
            const x = (idx / Math.max(values.length - 1, 1)) * 100;
            const y = 100 - (value / max) * 100;
            return <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="#4f46e5" />;
          })}
        </svg>
      </div>
      <div className="mt-3 text-xs text-slate-500 flex justify-between">
        <span>{labels[0] || "-"}</span>
        <span>{labels[labels.length - 1] || "-"}</span>
      </div>
    </div>
  );
};

const SimpleBarChart = ({ rows, valueKey, title }) => {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-md p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600">
          Top 8
        </span>
      </div>
      <div className="space-y-3">
        {rows.length > 0 ? (
          rows.map((row, idx) => {
            const val = Number(row[valueKey] || 0);
            const width = `${(val / max) * 100}%`;
            return (
              <div key={`${row.label}-${idx}`}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span className="truncate max-w-[65%]">{row.label}</span>
                  <span>{money(val)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">No chart data.</p>
        )}
      </div>
    </div>
  );
};

const Reports = () => {
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const prior = new Date();
  prior.setDate(prior.getDate() - 30);
  const defaultStart = prior.toISOString().slice(0, 10);

  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalCount: 0 });
  const [detailColumns, setDetailColumns] = useState([
    { key: "label", label: "Label" },
    { key: "count", label: "Count" },
    { key: "totalRevenue", label: "Revenue" },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getMethod(
        `${REPORTS_DATA_API}?type=${reportType}&startDate=${startDate}&endDate=${endDate}`,
      );
      setRows(response?.data?.rows || []);
      setSummary(response?.data?.summary || { totalRevenue: 0, totalCount: 0 });
      setDetailColumns(response?.data?.detailColumns || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
      setRows([]);
      setSummary({ totalRevenue: 0, totalCount: 0 });
      setDetailColumns([
        { key: "label", label: "Label" },
        { key: "count", label: "Count" },
        { key: "totalRevenue", label: "Revenue" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reportType]);

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        label: String(toLabel(row, reportType)),
        revenue: reportType === "sales" ? Number(row.total || 0) : Number(row.totalRevenue || 0),
      })),
    [rows, reportType],
  );

  const chartLabels = normalizedRows.slice(0, 14).map((row) => row.label);
  const chartValues = normalizedRows.slice(0, 14).map((row) => row.revenue);
  const topBars = normalizedRows.slice(0, 8);
  const averageValue =
    Number(summary.totalCount || 0) > 0 ? Number(summary.totalRevenue || 0) / Number(summary.totalCount || 1) : 0;
  const topItem = normalizedRows[0]?.label || "-";

  return (
    <div className="space-y-6 pb-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 p-7 text-white shadow-2xl">
        <div className="absolute -top-20 -right-10 h-56 w-56 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <p className="text-sm text-indigo-100 relative z-10">Analytics & Insights</p>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Reports</h1>
        <p className="text-sm text-indigo-100/90 mt-1 relative z-10">
          Visualize delivered sales, products, and customer data with interactive charts.
        </p>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-md p-4 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.55)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="sales">Sales</option>
            <option value="daily_sales">Daily Sales</option>
            <option value="weekly_sales">Weekly Sales</option>
            <option value="monthly_sales">Monthly Sales</option>
            <option value="products">Products</option>
            <option value="customers">Customers</option>
            <option value="services">Services</option>
            <option value="service_popularity">Service Popularity</option>
            <option value="technician_performance">Technician Performance</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={fetchData}
            className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all"
          >
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white to-indigo-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Revenue</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{money(summary.totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Records</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{normalizedRows.length}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white to-cyan-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Units / Orders</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{summary.totalCount}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average Value</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{money(averageValue)}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white to-fuchsia-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Top Performer</p>
          <p className="text-lg font-semibold text-slate-900 mt-1 truncate">{topItem}</p>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[260px] flex items-center justify-center rounded-3xl border border-white/60 bg-white/80 backdrop-blur-md">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <SimpleLineChart labels={chartLabels} values={chartValues} />
            <SimpleBarChart rows={topBars} valueKey="revenue" title="Top Revenue Breakdown" />
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/85 backdrop-blur-md shadow-[0_20px_50px_-35px_rgba(15,23,42,0.55)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/60">
                  <tr>
                    {detailColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {normalizedRows.length > 0 ? (
                    normalizedRows.map((row, index) => (
                      <tr key={`${row.label}-${index}`} className="hover:bg-indigo-50/40 transition-colors">
                        {detailColumns.map((column) => {
                          let value = row[column.key];
                          if (column.key === "label") value = row.label;
                          if (column.key === "totalRevenue") value = money(value);
                          if (column.key === "avgTicket") value = money(value);
                          if (column.key === "averageTime")
                            value = `${Number(value || 0).toFixed(1)} min`;
                          if (
                            column.key !== "label" &&
                            column.key !== "totalRevenue" &&
                            column.key !== "avgTicket" &&
                            column.key !== "averageTime"
                          ) {
                            value = Number(value || 0);
                          }
                          return (
                            <td
                              key={`${column.key}-${index}`}
                              className={`px-4 py-3 text-sm ${
                                column.key === "totalRevenue" || column.key === "avgTicket"
                                  ? "font-medium text-slate-900"
                                  : "text-slate-700"
                              }`}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={Math.max(detailColumns.length, 1)}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No report data found for the selected range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
