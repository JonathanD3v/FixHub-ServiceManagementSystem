import React, { useState, useEffect, useRef } from "react";
import {
  getMethod,
  postMethod,
  putMethod,
  patchMethod,
  deleteMethod,
} from "../services/index.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    cost: "0",
    estimatedTime: 60,
    image: "",
    isActive: true,
    popular: false,
  });

  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  // Service categories
  const categories = ["Phone", "Laptop", "Tablet", "Computer", "Other"];

  // Fetch services
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getMethod("/admin/services");
      if (response.status === "success") {
        setServices(response.data.services);
      } else {
        console.error("Invalid services response format:", response);
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error fetching services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          image: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Service description is required");
      return;
    }

    if (!formData.price || formData.price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!formData.estimatedTime || formData.estimatedTime <= 0) {
      toast.error("Please enter a valid estimated time");
      return;
    }

    try {
      setUploading(true);

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("price", formData.price);
      formDataToSend.append("cost", formData.cost);
      formDataToSend.append("estimatedTime", formData.estimatedTime);
      formDataToSend.append("isActive", formData.isActive);
      formDataToSend.append("popular", formData.popular);

      // Add image file if selected, otherwise send existing image path for updates
      if (imageFile) {
        // New file selected - send the file object
        formDataToSend.append("image", imageFile);
      } else if (
        selectedService &&
        formData.image &&
        !formData.image.startsWith("data:")
      ) {
        // For updates without new file, send the existing image path if no new file is selected
        // Don't send data URLs (which start with 'data:')
        formDataToSend.append("image", formData.image);
      }
      // If no imageFile and formData.image is a data URL or empty, don't send image

      let response;
      if (selectedService) {
        // Update existing service
        response = await putMethod(
          `/admin/services/${selectedService._id}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
        toast.success("Service updated successfully");
      } else {
        // Create new service
        response = await postMethod("/admin/services", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Service created successfully");
      }

      setIsModalOpen(false);
      fetchServices();
      resetForm();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(error.response?.data?.message || "Error saving service");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteMethod(`/admin/services/${id}`);
        toast.success("Service deleted successfully");
        fetchServices();
      } catch (error) {
        toast.error("Error deleting service");
      }
    }
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name || "",
      category: service.category || "",
      description: service.description || "",
      price: service.price || "",
      cost: service.cost || "0",
      estimatedTime: service.estimatedTime || 60,
      image: service.image || "",
      isActive: service.isActive !== false,
      popular: service.popular || false,
    });
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      await patchMethod(`/admin/services/${id}/toggle`);
      toast.success("Service status updated");
      fetchServices();
    } catch (error) {
      toast.error("Error updating service status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      price: "",
      cost: "0",
      estimatedTime: 60,
      image: "",
      isActive: true,
      popular: false,
    });
    setSelectedService(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5555${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-indigo-100">Catalog Management</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Services</h1>
            <p className="text-sm text-indigo-100/90 mt-1">
              Manage repair services with premium presentation.
            </p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-xs text-indigo-100 uppercase tracking-wide">
              Total Services
            </p>
            <p className="text-2xl font-semibold">{services.length}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2.5 rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:shadow-lg transition"
        >
          Add Service
        </button>
      </div>

      {/* Services Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {Array.isArray(services) && services.length > 0 ? (
          services.map((service) => (
            <div
              key={service._id}
              className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Service Image */}
              <div className="relative h-48 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100">
                {service.image ? (
                  <img
                    src={getImageUrl(service.image)}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur ${
                      service.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {service.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {/* Popular Badge */}
                {service.popular && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
                      Popular
                    </span>
                  </div>
                )}
              </div>

              {/* Service Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${service.price.toFixed(2)}
                    </span>
                    <p className="text-xs text-gray-500">
                      {service.estimatedTime} min
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                    {service.category}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    Cost: ${service.cost || 0}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleToggleStatus(service._id)}
                    className={`inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg ${
                      service.isActive
                        ? "text-red-700 bg-red-100 hover:bg-red-200"
                        : "text-green-700 bg-green-100 hover:bg-green-200"
                    }`}
                  >
                    {service.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service._id)}
                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">
              No services found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new service.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New Service
            </button>
          </div>
        )}
      </div>

      {/* Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedService ? "Edit Service" : "Add New Service"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Pricing and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price * ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estimated Time (minutes) *
                  </label>
                  <input
                    type="number"
                    name="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Image
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {formData.image && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border">
                      <img
                        src={getImageUrl(formData.image)}
                        alt="Service preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(
                            "Failed to load image:",
                            getImageUrl(formData.image),
                          );
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active Service
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="popular"
                      checked={formData.popular}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Popular Service
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading
                    ? "Saving..."
                    : selectedService
                      ? "Update Service"
                      : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
