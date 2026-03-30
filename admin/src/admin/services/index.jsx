import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // console.log('API Request:', {
    //   url: config.url,
    //   method: config.method,
    //   headers: config.headers,
    //   data: config.data
    // });
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // console.log('API Response:', {
    //   url: response.config.url,
    //   status: response.status,
    //   data: response.data
    // });
    return response.data;
  },
  (error) => {
    console.error("API Response Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Dispatch custom event to notify AuthContext
      window.dispatchEvent(new CustomEvent("auth:logout"));
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  },
);

// API methods
export const getMethod = async (url) => {
  try {
    return await api.get(url);
  } catch (error) {
    console.error(`GET ${url} failed:`, error);
    throw error;
  }
};

export const postMethod = async (url, data, config = {}) => {
  try {
    return await api.post(url, data, config);
  } catch (error) {
    console.error(`POST ${url} failed:`, error);
    throw error;
  }
};

export const putMethod = async (url, data, config = {}) => {
  try {
    return await api.put(url, data, config);
  } catch (error) {
    console.error(`PUT ${url} failed:`, error);
    throw error;
  }
};

export const patchMethod = async (url, data, config = {}) => {
  try {
    return await api.patch(url, data, config);
  } catch (error) {
    console.error(`PATCH ${url} failed:`, error);
    throw error;
  }
};

export const deleteMethod = async (url) => {
  try {
    return await api.delete(url);
  } catch (error) {
    console.error(`DELETE ${url} failed:`, error);
    throw error;
  }
};

// Dashboard specific methods
export const getDashboardStats = async () => {
  return getMethod("/admin/dashboard/stats");
};

export const getReports = async (type, startDate, endDate) => {
  return getMethod(
    `/admin/dashboard/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`,
  );
};

// File upload method
export const uploadFiles = async (url, files) => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error(`File upload to ${url} failed:`, error);
    throw error;
  }
};
