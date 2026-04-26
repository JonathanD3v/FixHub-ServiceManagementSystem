import { postMethod, getMethod, putMethod, deleteMethod } from "./index.jsx";
import {
  SERVICE_REQUESTS_API,
  ASSIGN_SERVICE_REQUEST_API,
  PENDING_SERVICE_REQUESTS_API,
  STAFF_DASHBOARD_API,
  SERVICE_REQUESTS_LIST_API,
  SERVICE_REQUEST_DETAIL_API,
  SERVICES_API,
} from "./constant.js";

// Create a new service request
export const createServiceRequest = async (requestData) => {
  try {
    const response = await postMethod(SERVICE_REQUESTS_API, requestData);
    return response;
  } catch (error) {
    console.error("Error creating service request:", error);
    throw error;
  }
};

// Assign a service request to a technician
export const assignServiceRequest = async (requestId, technicianId) => {
  try {
    const response = await postMethod(ASSIGN_SERVICE_REQUEST_API, {
      serviceRequestId: requestId,
      technicianId: technicianId,
    });
    return response;
  } catch (error) {
    console.error("Error assigning service request:", error);
    throw error;
  }
};

// Get pending service requests
export const getPendingServiceRequests = async () => {
  try {
    const response = await getMethod(PENDING_SERVICE_REQUESTS_API);
    return response;
  } catch (error) {
    console.error("Error fetching pending service requests:", error);
    throw error;
  }
};

// Get staff dashboard stats
export const getStaffDashboardStats = async () => {
  try {
    const response = await getMethod(STAFF_DASHBOARD_API);
    return response;
  } catch (error) {
    console.error("Error fetching staff dashboard stats:", error);
    throw error;
  }
};

export const getAllServiceRequests = async () => {
  try {
    return await getMethod(SERVICE_REQUESTS_LIST_API);
  } catch (error) {
    console.error("Error fetching all service requests:", error);
    throw error;
  }
};

export const updateServiceRequest = async (id, payload) => {
  try {
    return await putMethod(SERVICE_REQUEST_DETAIL_API(id), payload);
  } catch (error) {
    console.error("Error updating service request:", error);
    throw error;
  }
};

export const deleteServiceRequest = async (id) => {
  try {
    return await deleteMethod(SERVICE_REQUEST_DETAIL_API(id));
  } catch (error) {
    console.error("Error deleting service request:", error);
    throw error;
  }
};

// Get all available services for selection
export const getServices = async () => {
  try {
    const response = await getMethod(SERVICES_API);
    return response;
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
};
