const Order = require("../../models/Order");
const User = require("../../models/User");
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

// Get Pending Service Requests for Staff to Accept/Assign
exports.getPendingServiceRequests = async (req, res) => {
  try {
    const pendingRequests = await ServiceRequest.find({
      status: { $in: ["pending", "assigned"] },
      assignedBy: null, // Not yet accepted by staff
    })
      .select(
        "_id requestNumber customerName deviceType deviceBrand deviceModel issueDescription status createdAt totalAmount paymentStatus",
      )
      .sort({ createdAt: -1 })
      .lean();

    const pendingCount = await ServiceRequest.countDocuments({
      status: "pending",
      assignedBy: null,
    });

    res.status(200).json({
      success: true,
      data: {
        pendingRequests,
        pendingCount,
      },
    });
  } catch (error) {
    console.error("Error fetching pending service requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending service requests",
      error: error.message,
    });
  }
};

// Assign Service Request to Technician
exports.assignServiceRequest = async (req, res) => {
  try {
    const { serviceRequestId, technicianId } = req.body;
    const staffId = req.user._id;

    // Validate inputs
    if (!serviceRequestId || !technicianId) {
      return res.status(400).json({
        success: false,
        message: "Service request ID and technician ID are required",
      });
    }

    // Check if technician exists and has technician role
    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== "technician") {
      return res.status(404).json({
        success: false,
        message: "Technician not found or invalid",
      });
    }

    // Find and update service request
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    if (
      serviceRequest.status !== "pending" &&
      serviceRequest.status !== "assigned"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign service request with status: ${serviceRequest.status}`,
      });
    }

    // Update service request
    serviceRequest.assignedTo = technicianId;
    serviceRequest.assignedBy = staffId;
    serviceRequest.assignedDate = new Date();
    serviceRequest.status = "assigned";

    await serviceRequest.save();

    // Populate technician info for response
    const updatedRequest = await ServiceRequest.findById(serviceRequestId)
      .populate("assignedTo", "name email phone role")
      .populate("assignedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Service request assigned successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error assigning service request:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning service request",
      error: error.message,
    });
  }
};

// Create Service Request by Staff
exports.createServiceRequest = async (req, res) => {
  try {
    const staffId = req.user._id;
    const {
      customerName,
      customerPhone,
      customerEmail,
      deviceType,
      deviceBrand,
      deviceModel,
      deviceColor,
      serialNumber,
      imei,
      issueDescription,
      customerNotes,
      serviceId,
      serviceName,
      servicePrice,
      estimatedTime,
      estimatedCompletionDate,
      assistedTechnicianId,
    } = req.body;

    // Validate required fields
    if (!customerName || !customerPhone || !deviceType || !issueDescription) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: customerName, customerPhone, deviceType, issueDescription",
      });
    }

    if (!assistedTechnicianId) {
      return res.status(400).json({
        success: false,
        message: "Technician ID is required",
      });
    }

    // Verify technician exists
    const technician = await User.findById(assistedTechnicianId);
    if (!technician || technician.role !== "technician") {
      return res.status(404).json({
        success: false,
        message: "Technician not found or invalid",
      });
    }

    // Generate request number
    const requestCount = await ServiceRequest.countDocuments();
    const requestNumber = `SR-${Date.now()}-${requestCount + 1}`;

    // Create service request
    const newRequest = new ServiceRequest({
      requestNumber,
      customerName,
      customerPhone,
      customerEmail,
      deviceType,
      deviceBrand,
      deviceModel,
      deviceColor,
      serialNumber,
      imei,
      issueDescription,
      customerNotes,
      serviceId,
      serviceName,
      servicePrice,
      estimatedTime,
      estimatedCompletionDate,
      assignedTo: assistedTechnicianId,
      assignedBy: staffId,
      assignedDate: new Date(),
      status: "assigned", // Staff created requests are immediately assigned
      receivedDate: new Date(),
      paymentStatus: "pending",
    });

    await newRequest.save();

    // Populate and return the created request
    const populatedRequest = await ServiceRequest.findById(newRequest._id)
      .populate("assignedTo", "name email phone role")
      .populate("assignedBy", "name email");

    res.status(201).json({
      success: true,
      message: "Service request created and assigned successfully",
      data: populatedRequest,
    });
  } catch (error) {
    console.error("Error creating service request:", error);
    res.status(500).json({
      success: false,
      message: "Error creating service request",
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
