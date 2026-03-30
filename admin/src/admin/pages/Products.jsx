import React, { useState, useEffect } from "react";
import {
  getMethod,
  postMethod,
  putMethod,
  deleteMethod,
} from "../services/index.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form data matching backend schema
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    shortDescription: "",
    price: "",
    comparePrice: "",
    stock: 0,
    lowStockThreshold: 5,
    images: [], // Existing image URLs from server
    newImages: [], // New image files to upload
    removeImages: [], // Image URLs to remove
    mainImage: "",
    isActive: true,
    isFeatured: false,
    discount: 0,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    editingId: null,
  });

  // Fetch products and categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getMethod("/admin/products");
      if (response.status === "success") {
        setProducts(response.data.products);
      } else {
        console.error("Invalid products response format:", response);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error fetching products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getMethod("/admin/categories");
      if (response.status === "success") {
        setCategories(response.data.categories);
      } else {
        console.error("Invalid categories response format:", response);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error fetching categories");
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      // Check file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (validTypes.includes(file.type)) {
        // Check file size (max 10MB)
        if (file.size <= 10 * 1024 * 1024) {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name} (exceeds 10MB)`);
        }
      } else {
        invalidFiles.push(`${file.name} (invalid format)`);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files: ${invalidFiles.join(", ")}`);
    }

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        newImages: [...prev.newImages, ...validFiles],
      }));
      toast.success(`${validFiles.length} image(s) added`);
    }
  };

  const handleRemoveExistingImage = (imageUrl) => {
    setFormData((prev) => ({
      ...prev,
      removeImages: [...prev.removeImages, imageUrl],
      images: prev.images.filter((img) => img !== imageUrl),
      mainImage:
        prev.mainImage === imageUrl
          ? prev.images.filter((img) => img !== imageUrl)[0] || ""
          : prev.mainImage,
    }));
  };

  const handleRemoveNewImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
  };

  const handleSetMainImage = (image) => {
    setFormData((prev) => ({
      ...prev,
      mainImage: image,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Product description is required");
      return;
    }

    if (!formData.price || formData.price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      setUploading(true);

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("name", formData.name.trim());
      if (formData.sku) formDataToSend.append("sku", formData.sku.trim());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description.trim());
      if (formData.shortDescription)
        formDataToSend.append(
          "shortDescription",
          formData.shortDescription.trim(),
        );
      formDataToSend.append("price", formData.price);
      if (formData.comparePrice)
        formDataToSend.append("comparePrice", formData.comparePrice);
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("lowStockThreshold", formData.lowStockThreshold);
      formDataToSend.append("isActive", formData.isActive);
      formDataToSend.append("isFeatured", formData.isFeatured);
      formDataToSend.append("discount", formData.discount);

      // Add new images
      formData.newImages.forEach((file, index) => {
        formDataToSend.append("images", file);
      });

      // Add images to remove (for update)
      if (formData.removeImages.length > 0) {
        formDataToSend.append(
          "removeImages",
          JSON.stringify(formData.removeImages),
        );
      }

      let response;
      if (selectedProduct) {
        // Update existing product
        response = await putMethod(
          `/admin/products/${selectedProduct._id}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
        toast.success("Product updated successfully");
      } else {
        // Create new product
        response = await postMethod("/admin/products", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Product created successfully");
      }

      setIsModalOpen(false);
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.response?.data?.message || "Error saving product");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteMethod(`/admin/products/${id}`);
        toast.success("Product deleted successfully");
        fetchProducts();
      } catch (error) {
        toast.error("Error deleting product");
      }
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category?._id || product.category || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      price: product.price || "",
      comparePrice: product.comparePrice || "",
      stock: product.stock || 0,
      lowStockThreshold: product.lowStockThreshold || 5,
      images: product.images || [],
      newImages: [],
      removeImages: [],
      mainImage: product.mainImage || product.images?.[0] || "",
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured || false,
      discount: product.discount || 0,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      description: "",
      shortDescription: "",
      price: "",
      comparePrice: "",
      stock: 0,
      lowStockThreshold: 5,
      images: [],
      newImages: [],
      removeImages: [],
      mainImage: "",
      isActive: true,
      isFeatured: false,
      discount: 0,
    });
    setSelectedProduct(null);
  };

  const handleCategoryInputChange = (e) => {
    setCategoryForm({
      ...categoryForm,
      name: e.target.value,
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (categoryForm.editingId) {
        await putMethod(`/admin/categories/${categoryForm.editingId}`, {
          name: categoryForm.name,
        });
        toast.success("Category updated successfully");
      } else {
        await postMethod("/admin/categories", {
          name: categoryForm.name,
        });
        toast.success("Category created successfully");
      }
      setCategoryForm({ name: "", editingId: null });
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error saving category");
    }
  };

  const handleCategoryEdit = (category) => {
    setCategoryForm({
      name: category.name,
      editingId: category._id,
    });
  };

  const handleCategoryDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteMethod(`/admin/categories/${id}`);
        toast.success("Category deleted successfully");
        fetchCategories();
      } catch (error) {
        toast.error("Error deleting category");
      }
    }
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
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="space-x-4">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Manage Categories
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Products Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.isArray(products) && products.length > 0 ? (
          products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {product.mainImage || (product.images && product.images[0]) ? (
                  <img
                    src={product.mainImage || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      product.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {/* Featured Badge */}
                {product.isFeatured && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white">
                      Featured
                    </span>
                  </div>
                )}
                {/* Discount Badge */}
                {product.discount > 0 && (
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                      {product.discount}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {product.shortDescription || product.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.comparePrice &&
                      product.comparePrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.comparePrice.toFixed(2)}
                        </span>
                      )}
                  </div>
                </div>

                {/* Category and Stock */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {product.category?.name || "Uncategorized"}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock > 10
                        ? "bg-green-100 text-green-800"
                        : product.stock > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </span>
                </div>

                {/* SKU if available */}
                {product.sku && (
                  <div className="mt-2 text-xs text-gray-500">
                    SKU: {product.sku}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
                    onClick={() => handleDelete(product._id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">
              No products found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new product.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
              Add New Product
            </button>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedProduct ? "Edit Product" : "Add New Product"}
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
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  rows="2"
                  maxLength="200"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.shortDescription.length}/200 characters
                </p>
              </div>

              {/* Pricing */}
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
                    Compare Price ($)
                  </label>
                  <input
                    type="number"
                    name="comparePrice"
                    value={formData.comparePrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Inventory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>

                {/* Upload Button */}
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors duration-200">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload images</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageSelect}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, WebP up to 10MB each
                    </p>
                  </div>
                </div>

                {/* Image Gallery */}
                {(formData.images.length > 0 ||
                  formData.newImages.length > 0) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Images (
                      {formData.images.length + formData.newImages.length})
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                      {/* Existing Images */}
                      {formData.images.map((image, index) => (
                        <div
                          key={`existing-${index}`}
                          className="relative group"
                        >
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(image)}
                              className={`p-1 rounded-full ${
                                formData.mainImage === image
                                  ? "bg-green-500 text-white"
                                  : "bg-white text-gray-700 hover:bg-gray-100"
                              }`}
                              title="Set as main image"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(image)}
                              className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                              title="Remove image"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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
                          {formData.mainImage === image && (
                            <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 rounded-tl-lg rounded-br-lg">
                              Main
                            </div>
                          )}
                        </div>
                      ))}

                      {/* New Images */}
                      {formData.newImages.map((file, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New ${index + 1}`}
                            className="h-24 w-24 object-cover rounded-lg border-2 border-indigo-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(index)}
                              className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                              title="Remove image"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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
                          <div className="absolute bottom-0 left-0 bg-indigo-500 text-white text-xs px-1 rounded-tr-lg rounded-bl-lg">
                            New
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                      Active
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Featured Product
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : selectedProduct ? (
                    "Update Product"
                  ) : (
                    "Create Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Manage Categories
              </h2>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryForm({ name: "", editingId: null });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
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

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={handleCategoryInputChange}
                  placeholder="Category name"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {categoryForm.editingId ? "Update Category" : "Add Category"}
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Existing Categories
                </h3>
                <div className="max-h-96 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {categories.map((category) => (
                      <li
                        key={category._id}
                        className="py-2 flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-900">
                          {category.name}
                        </span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => handleCategoryEdit(category)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategoryDelete(category._id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setCategoryForm({ name: "", editingId: null });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
