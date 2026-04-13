const User = require("../../models/User");
const ServiceRequest = require("../../models/ServiceRequest");

const getServiceRequestScope = (req) => {
  if (req.user?.role === "admin") return {};
  return {
    $or: [{ createdBy: req.user._id }, { assignedBy: req.user._id }],
  };
};

exports.getAllServiceRequests = async (req, res) => {
  try {
    const scope = getServiceRequestScope(req);
    const requests = await ServiceRequest.find(scope)
      .populate("assignedTo", "name email phone role")
      .populate("assignedBy", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching service requests",
      error: error.message,
    });
  }
};

exports.getServiceRequest = async (req, res) => {
  try {
    const scope = getServiceRequestScope(req);
    const request = await ServiceRequest.findOne({
      _id: req.params.id,
      ...scope,
    })
      .populate("assignedTo", "name email phone role")
      .populate("assignedBy", "name email")
      .populate("createdBy", "name email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Error fetching service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching service request",
      error: error.message,
    });
  }
};

// Get pending service requests for staff to accept/assign
exports.getPendingServiceRequests = async (req, res) => {
  try {
    // "Pending requests" should be assignable items, so we key off assignment fields.
    // This is safer than assignedBy:null for legacy rows and the new optional assignment flow.
    const pendingFilter = {
      $or: [
        { status: "pending", assignedTo: null },
        { status: "assigned", assignedTo: null },
      ],
    };

    const pendingRequests = await ServiceRequest.find(pendingFilter)
      .select(
        "_id requestNumber customerName customerPhone deviceType deviceBrand deviceModel issueDescription status createdAt totalAmount paymentStatus assignedTo assignedBy",
      )
      .sort({ createdAt: -1 })
      .lean();

    const pendingCount = await ServiceRequest.countDocuments(pendingFilter);

    return res.status(200).json({
      success: true,
      pendingRequests,
      pendingCount,
      data: {
        pendingRequests,
        pendingCount,
      },
    });
  } catch (error) {
    console.error("Error fetching pending service requests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching pending service requests",
      error: error.message,
    });
  }
};

// Assign service request to technician
exports.assignServiceRequest = async (req, res) => {
  try {
    const { serviceRequestId, technicianId } = req.body;
    const staffId = req.user._id;

    if (!serviceRequestId || !technicianId) {
      return res.status(400).json({
        success: false,
        message: "Service request ID and technician ID are required",
      });
    }

    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== "technician") {
      return res.status(404).json({
        success: false,
        message: "Technician not found or invalid",
      });
    }

    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    if (!["pending", "assigned"].includes(serviceRequest.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign service request with status: ${serviceRequest.status}`,
      });
    }

    serviceRequest.assignedTo = technicianId;
    serviceRequest.assignedBy = staffId;
    serviceRequest.assignedDate = new Date();
    serviceRequest.status = "assigned";

    await serviceRequest.save();

    const updatedRequest = await ServiceRequest.findById(serviceRequestId)
      .populate("assignedTo", "name email phone role")
      .populate("assignedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Service request assigned successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error assigning service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error assigning service request",
      error: error.message,
    });
  }
};

// Create service request by staff
exports.createServiceRequest = async (req, res) => {
  try {
    const staffId = req.user._id;
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      deviceType,
      deviceBrand,
      deviceModel,
      deviceColor,
      serialNumber,
      imei,
      issueDescription,
      customerNotes,
      paymentMethod,
      laborCost,
      partsCost,
      serviceId,
      serviceName,
      servicePrice,
      estimatedTime,
      estimatedCompletionDate,
      assistedTechnicianId,
    } = req.body;

    if (!customerName || !customerPhone || !deviceType || !issueDescription) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: customerName, customerPhone, deviceType, issueDescription",
      });
    }

    let technician = null;
    if (assistedTechnicianId) {
      technician = await User.findById(assistedTechnicianId);
      if (!technician || technician.role !== "technician") {
        return res.status(404).json({
          success: false,
          message: "Technician not found or invalid",
        });
      }
    }

    const normalizedPaymentMethod =
      paymentMethod && paymentMethod.trim() !== "" ? paymentMethod : undefined;

    const newRequest = new ServiceRequest({
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      deviceType,
      deviceBrand,
      deviceModel,
      deviceColor,
      serialNumber,
      imei,
      issueDescription,
      customerNotes,
      paymentMethod: normalizedPaymentMethod,
      laborCost: Number(laborCost) || 0,
      partsCost: Number(partsCost) || 0,
      serviceId,
      serviceName,
      servicePrice,
      estimatedTime,
      estimatedCompletionDate,
      assignedTo: technician ? assistedTechnicianId : null,
      assignedBy: technician ? staffId : null,
      assignedDate: technician ? new Date() : null,
      status: technician ? "assigned" : "pending",
      receivedDate: new Date(),
      paymentStatus: "pending",
      createdBy: staffId,
    });

    await newRequest.save();

    const populatedRequest = await ServiceRequest.findById(newRequest._id)
      .populate("assignedTo", "name email phone role")
      .populate("assignedBy", "name email");

    return res.status(201).json({
      success: true,
      message: technician
        ? "Service request created and assigned successfully"
        : "Service request created successfully and pending assignment",
      data: populatedRequest,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || "Invalid service request data",
        errors: messages,
      });
    }
    console.error("Error creating service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating service request",
      error: error.message,
    });
  }
};

exports.updateServiceRequest = async (req, res) => {
  try {
    const scope = getServiceRequestScope(req);
    const request = await ServiceRequest.findOne({
      _id: req.params.id,
      ...scope,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const allowedFields = [
      "customerName",
      "customerPhone",
      "customerEmail",
      "customerAddress",
      "deviceType",
      "deviceBrand",
      "deviceModel",
      "deviceColor",
      "serialNumber",
      "imei",
      "issueDescription",
      "customerNotes",
      "paymentMethod",
      "laborCost",
      "partsCost",
      "status",
      "paymentStatus",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "paymentMethod") {
          request[field] =
            req.body[field] && req.body[field].trim() !== ""
              ? req.body[field]
              : undefined;
        } else {
          request[field] = req.body[field];
        }
      }
    });

    if (req.body.assistedTechnicianId !== undefined) {
      if (!req.body.assistedTechnicianId) {
        request.assignedTo = null;
        request.assignedBy = null;
        request.assignedDate = null;
        if (request.status === "assigned") request.status = "pending";
      } else {
        const technician = await User.findById(req.body.assistedTechnicianId);
        if (!technician || technician.role !== "technician") {
          return res.status(404).json({
            success: false,
            message: "Technician not found or invalid",
          });
        }
        request.assignedTo = req.body.assistedTechnicianId;
        request.assignedBy = req.user._id;
        request.assignedDate = new Date();
        if (request.status === "pending") request.status = "assigned";
      }
    }

    await request.save();

    const updatedRequest = await ServiceRequest.findById(request._id)
      .populate("assignedTo", "name email phone role")
      .populate("assignedBy", "name email")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Service request updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || "Invalid service request data",
        errors: messages,
      });
    }
    console.error("Error updating service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating service request",
      error: error.message,
    });
  }
};

exports.deleteServiceRequest = async (req, res) => {
  try {
    const scope = getServiceRequestScope(req);
    const deleted = await ServiceRequest.findOneAndDelete({
      _id: req.params.id,
      ...scope,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting service request",
      error: error.message,
    });
  }
};
