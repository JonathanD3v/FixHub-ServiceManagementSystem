const Order = require("../../models/Order");
const ServiceRequest = require("../../models/ServiceRequest");

const parseDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

exports.getReportData = async (req, res) => {
  try {
    const { type = "sales", startDate, endDate } = req.query;
    const range = parseDateRange(startDate, endDate);

    if (!range) {
      return res.status(400).json({ success: false, message: "Invalid date range" });
    }

    const orderBaseMatch = {
      createdAt: { $gte: range.start, $lte: range.end },
      orderStatus: "delivered",
    };

    let rows = [];
    let detailColumns = [
      { key: "label", label: "Label" },
      { key: "count", label: "Count" },
      { key: "totalRevenue", label: "Revenue" },
    ];

    if (type === "sales" || type === "daily_sales") {
      rows = await Order.aggregate([
        { $match: orderBaseMatch },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);
      rows = rows.map((row) => ({ ...row, totalRevenue: row.total || 0 }));
      detailColumns = [
        { key: "label", label: "Date" },
        { key: "count", label: "Delivered Orders" },
        { key: "totalRevenue", label: "Revenue" },
      ];
    } else if (type === "weekly_sales") {
      rows = await Order.aggregate([
        { $match: orderBaseMatch },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: "$createdAt" },
              week: { $isoWeek: "$createdAt" },
            },
            totalRevenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.week": 1 } },
      ]);
      detailColumns = [
        { key: "label", label: "Week" },
        { key: "count", label: "Delivered Orders" },
        { key: "totalRevenue", label: "Revenue" },
      ];
    } else if (type === "monthly_sales") {
      rows = await Order.aggregate([
        { $match: orderBaseMatch },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalRevenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);
      detailColumns = [
        { key: "label", label: "Month" },
        { key: "count", label: "Delivered Orders" },
        { key: "totalRevenue", label: "Revenue" },
      ];
    } else if (type === "products" || type === "product_sales") {
      rows = await Order.aggregate([
        { $match: orderBaseMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] },
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $sort: { totalRevenue: -1 } },
      ]);
      detailColumns = [
        { key: "label", label: "Product" },
        { key: "totalSold", label: "Units Sold" },
        { key: "totalRevenue", label: "Revenue" },
      ];
    } else if (type === "customers") {
      rows = await Order.aggregate([
        { $match: orderBaseMatch },
        {
          $group: {
            _id: "$user",
            totalSpent: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "customer",
          },
        },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        { $sort: { totalSpent: -1 } },
      ]);
      rows = rows.map((row) => ({ ...row, totalRevenue: row.totalSpent || 0 }));
      detailColumns = [
        { key: "label", label: "Customer" },
        { key: "orderCount", label: "Orders" },
        { key: "totalRevenue", label: "Revenue" },
      ];
    } else if (type === "services" || type === "service_popularity") {
      rows = await ServiceRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: range.start, $lte: range.end },
            status: { $in: ["completed", "delivered"] },
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$serviceName", "General Service"] },
            totalRequests: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            avgTicket: { $avg: "$totalAmount" },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]);
      detailColumns = [
        { key: "label", label: "Service" },
        { key: "totalRequests", label: "Requests" },
        { key: "avgTicket", label: "Avg Ticket" },
        { key: "totalRevenue", label: "Revenue" },
      ];
    } else if (type === "technician_performance") {
      rows = await ServiceRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: range.start, $lte: range.end },
            status: { $in: ["completed", "delivered"] },
            assignedTo: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$assignedTo",
            completedJobs: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            averageTime: { $avg: { $ifNull: ["$actualMinutes", 0] } },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "technician",
          },
        },
        { $unwind: { path: "$technician", preserveNullAndEmptyArrays: true } },
        { $sort: { totalRevenue: -1 } },
      ]);
      detailColumns = [
        { key: "label", label: "Technician" },
        { key: "completedJobs", label: "Completed Jobs" },
        { key: "averageTime", label: "Avg Minutes" },
        { key: "totalRevenue", label: "Revenue" },
      ];
    } else {
      return res.status(400).json({ success: false, message: "Invalid report type" });
    }

    const summary = rows.reduce(
      (acc, row) => {
        const revenue = Number(row.total || row.totalRevenue || 0);
        const count = Number(
          row.count ||
            row.totalSold ||
            row.orderCount ||
            row.totalRequests ||
            row.completedJobs ||
            0,
        );
        acc.totalRevenue += revenue;
        acc.totalCount += count;
        return acc;
      },
      { totalRevenue: 0, totalCount: 0 },
    );

    return res.status(200).json({
      success: true,
      data: {
        type,
        startDate: range.start,
        endDate: range.end,
        rows,
        summary,
        detailColumns,
      },
    });
  } catch (error) {
    console.error("Get report data error:", error);
    return res.status(500).json({ success: false, message: "Error fetching report data" });
  }
};
