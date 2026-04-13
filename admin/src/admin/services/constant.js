const domain = import.meta.env.REACT_APP_DOMAIN || "http://localhost:5555";

// Auth APIs
export const LOGIN_API = "/admin/auth/login";
export const LOGOUT_API = "/admin/auth/logout";
export const REFRESH_TOKEN_API = "/auth/refresh-token";

// API Base URL
export const API_BASE_URL = "http://localhost:5555";

// Auth Token Key
export const AUTH_TOKEN_KEY = "auth_token";

// User Management APIs
export const USERS_API = `${domain}/api/admin/users`;
export const USER_DETAIL_API = (id) => `${domain}/api/admin/users/${id}`;
export const ROLES_API = `${domain}/api/admin/roles`;

// Product Management APIs
export const PRODUCTS_API = `${domain}/api/admin/products`;
export const PRODUCT_DETAIL_API = (id) => `${domain}/api/admin/products/${id}`;
export const PRODUCTS_BULK_API = `${domain}/api/admin/products/bulk`;
export const CATEGORIES_API = `${domain}/api/admin/categories`;
export const CATEGORY_DETAIL_API = (id) =>
  `${domain}/api/admin/categories/${id}`;

// Order Management APIs
export const ORDERS_API = `${domain}/api/admin/orders`;
export const ORDER_DETAIL_API = (id) => `${domain}/api/admin/orders/${id}`;
export const ORDER_STATUS_API = (id) =>
  `${domain}/api/admin/orders/${id}/status`;
export const ORDER_REFUND_API = (id) =>
  `${domain}/api/admin/orders/${id}/refund`;

// Customer Management APIs
export const CUSTOMERS_API = `${domain}/api/admin/customers`;
export const CUSTOMER_DETAIL_API = (id) =>
  `${domain}/api/admin/customers/${id}`;
export const CUSTOMER_ORDERS_API = (id) =>
  `${domain}/api/admin/customers/${id}/orders`;

// Inventory Management APIs
export const INVENTORY_API = `${domain}/api/admin/inventory`;
export const INVENTORY_ITEM_API = (id) => `${domain}/api/admin/inventory/${id}`;
export const INVENTORY_ADJUST_API = `${domain}/api/admin/inventory/adjust`;
export const INVENTORY_HISTORY_API = `${domain}/api/admin/inventory/history`;
export const SUPPLIERS_API = `${domain}/api/admin/suppliers`;
export const SUPPLIER_DETAIL_API = (id) =>
  `${domain}/api/admin/suppliers/${id}`;

// Dashboard & Reports APIs
export const DASHBOARD_STATS_API = `${domain}/api/admin/dashboard/stats`;
export const DASHBOARD_REPORTS_API = `${domain}/api/admin/dashboard/reports`;

// Settings APIs
// export const SETTINGS_API = `${domain}/api/admin/settings`;
// export const PAYMENT_METHODS_API = `${domain}/api/admin/payment-methods`;

// Media Management APIs
export const MEDIA_UPLOAD_API = `${domain}/api/admin/media/upload`;
export const MEDIA_API = `${domain}/api/admin/media`;
export const MEDIA_DETAIL_API = (id) => `${domain}/api/admin/media/${id}`;

// Service Request Management APIs
export const SERVICE_REQUESTS_API = `${domain}/api/admin/staff/create-request`;
export const ASSIGN_SERVICE_REQUEST_API = `${domain}/api/admin/staff/assign-request`;
export const PENDING_SERVICE_REQUESTS_API = `${domain}/api/admin/staff/pending-requests`;
export const STAFF_DASHBOARD_API = `${domain}/api/admin/staff/dashboard`;
export const SERVICE_REQUESTS_LIST_API = `${domain}/api/admin/service-requests`;
export const SERVICE_REQUEST_DETAIL_API = (id) =>
  `${domain}/api/admin/service-requests/${id}`;
