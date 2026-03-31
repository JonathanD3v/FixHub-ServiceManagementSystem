import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Slideshow from "../components/shop/Slideshow";
import { getImageUrl } from "../utils/formatters";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoryRes, serviceRes] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
          api.get("/services"),
        ]);

        const productData =
          productRes.data?.data?.products || productRes.data?.data || [];
        const categoryData =
          categoryRes.data?.data?.categories || categoryRes.data?.data || [];
        const serviceData =
          serviceRes.data?.data?.services || serviceRes.data?.data || [];

        setProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setServices(Array.isArray(serviceData) ? serviceData : []);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error fetching data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : selectedCategory === "services"
      ? []
      : products.filter((p) => p?.category?._id === selectedCategory);

  const filteredServices =
    selectedCategory === "services" ? services : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      {/* Hero Section with Slideshow */}
      <Slideshow />

      {/* Categories & Services */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition
              ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition
                ${
                  selectedCategory === cat._id
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              {cat.name}
            </button>
          ))}

          {/* SERVICES BUTTON */}
          <button
            onClick={() => setSelectedCategory("services")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition
              ${
                selectedCategory === "services"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            Services
          </button>
        </div>

        {/* Grid */}
        {selectedCategory === "services" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <div
                  key={service._id}
                  className="group bg-white/80 dark:bg-gray-800 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                >
                  <div className="relative pb-[100%] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <img
                      src={getImageUrl(service.image)}
                      alt={service.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition mb-2">
                      {service.name}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                      {service.description}
                    </p>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      ${service.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No services found
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Link
                  to={`/products/${product._id}`}
                  key={product._id}
                  className="group bg-white/80 dark:bg-gray-800 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                >
                  <div className="relative pb-[100%] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow">
                          {product.discount}% OFF
                        </span>
                      </div>
                    )}
                    {product.stock < 5 && (
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 rounded-md text-xs bg-yellow-400 text-black font-medium">
                          Low Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">
                      {product.category?.name}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition mb-1">
                      {product.name}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {product.shortDescription || product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {product.discount > 0 ? (
                          <>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              $
                              {(
                                product.price *
                                (1 - product.discount / 100)
                              ).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No products found
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;