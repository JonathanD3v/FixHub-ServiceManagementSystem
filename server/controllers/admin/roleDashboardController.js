const Order = require("../../models/Order");
const ServiceRequest = require("../../models/ServiceRequest");
const TimezoneService = require("../../services/TimezoneService");

// Get Staff Dashboard Stats
exports.getStaffDashboardStats = async (req, res) => {
  try {
    const staffId = req.user._id;
    const staffOrderScope = {
      $or: [
        { processedBy: staffId },
        { createdBy: staffId },
        { "statusHistory.updatedBy": staffId },
      ],
    };

    const staffServiceScope = {
      $or: [{ assignedBy: staffId }, { createdBy: staffId }],
    };

    // Get assigned orders for this staff member
    const [
      assignedOrders,
      deliveredOrders,
      pendingOrders,
      totalRevenue,
      recentOrders,
      pendingServiceRequests,
      assignedServiceRequests,
      completedServiceRequests,
      totalServiceRevenue,
      recentServiceRequests,
    ] = await Promise.all([
      Order.countDocuments({
        ...staffOrderScope,
        orderStatus: { $in: ["pending", "processing", "shipped"] },
      }),
      Order.countDocuments({ ...staffOrderScope, orderStatus: "delivered" }),
      Order.countDocuments({
        ...staffOrderScope,
        orderStatus: { $in: ["pending", "processing"] },
      }),
      Order.aggregate([
        { $match: { ...staffOrderScope, orderStatus: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.find(staffOrderScope)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("_id customerName totalAmount orderStatus createdAt")
        .lean(),
      // Service Request metrics
      ServiceRequest.countDocuments({
        status: "pending",
        assignedTo: null,
      }),
      ServiceRequest.countDocuments({
        ...staffServiceScope,
        status: { $in: ["assigned", "in-progress", "completed"] },
      }),
      ServiceRequest.countDocuments({
        ...staffServiceScope,
        status: "completed",
      }),
      ServiceRequest.aggregate([
        { $match: { ...staffServiceScope, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      ServiceRequest.find(staffServiceScope)
        .populate("assignedTo", "name")
        .populate("assignedBy", "name")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .select(
          "_id requestNumber customerName deviceType deviceBrand status createdAt totalAmount paymentStatus assignedTo assignedBy createdBy",
        )
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        assignedOrders,
        deliveredOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        orders: recentOrders,
        pendingServiceRequests,
        assignedServiceRequests,
        completedServiceRequests,
        totalServiceRevenue: totalServiceRevenue[0]?.total || 0,
        serviceRequests: recentServiceRequests,
        performanceData: [
          {
            label: "Completion Rate (Orders)",
            value:
              assignedOrders + deliveredOrders > 0
                ? Math.round(
                    (deliveredOrders / (assignedOrders + deliveredOrders)) *
                      100,
                  ) + "%"
                : "0%",
          },
          {
            label: "Total Orders Handled",
            value: assignedOrders + deliveredOrders,
          },
          {
            label: "Service Requests Assigned",
            value: assignedServiceRequests,
          },
          {
            label: "Service Requests Completed",
            value: completedServiceRequests,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching staff dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

// Get Technician Dashboard Stats
exports.getTechnicianDashboardStats = async (req, res) => {
  try {
    const technicianId = req.user._id;

    // Get assigned services for this technician
    const [
      assignedServices,
      completedServices,
      inProgressServices,
      totalServiceRevenue,
      recentServices,
    ] = await Promise.all([
      ServiceRequest.countDocuments({
        assignedTo: technicianId,
        status: "assigned",
      }),
      ServiceRequest.countDocuments({
        assignedTo: technicianId,
        status: "completed",
      }),
      ServiceRequest.countDocuments({
        assignedTo: technicianId,
        status: "in-progress",
      }),
      ServiceRequest.aggregate([
        { $match: { assignedTo: technicianId, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      ServiceRequest.find({ assignedTo: technicianId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select(
          "_id requestNumber customerName deviceModel deviceType status createdAt totalAmount",
        )
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        assignedServices,
        inProgressServices,
        completedServices,
        totalServiceRevenue: totalServiceRevenue[0]?.total || 0,
        services: recentServices,
        performanceMetrics: [
          {
            label: "Completion Rate",
            value:
              assignedServices + completedServices > 0
                ? Math.round(
                    (completedServices /
                      (assignedServices + completedServices)) *
                      100,
                  ) + "%"
                : "0%",
          },
          {
            label: "Average Time to Complete",
            value: "2.5 days", // This would require more complex calculation
          },
          {
            label: "Total Services Handled",
            value: assignedServices + completedServices,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching technician dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};
