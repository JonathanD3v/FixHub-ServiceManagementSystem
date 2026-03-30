import toast from "react-hot-toast";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import moment from "moment";

// Toast notifications
export const showToast = (message, type = "success") => {
  if (type === "success") {
    toast.success(message);
  } else if (type === "error") {
    toast.error(message);
  } else if (type === "warning") {
    toast(message, { icon: "⚠️" });
  } else {
    toast(message);
  }
};

// Encryption/Decryption
export const encryptData = (data) => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    "your-secret-key",
  ).toString();
};

export const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, "your-secret-key");
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Sweet Alert
export const showConfirmDialog = async (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });
};

// Date formatting
export const formatDate = (date, format = "YYYY-MM-DD") => {
  return moment(date).format(format);
};

export const formatDateTime = (date) => {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
};

// Validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password) => {
  return password.length >= 6;
};

// Local Storage
export const setLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getLocalStorage = (key) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const removeLocalStorage = (key) => {
  localStorage.removeItem(key);
};
