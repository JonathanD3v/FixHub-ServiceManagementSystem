import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../utils/formatters";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDetails, setPaymentDetails] = useState({
    cardHolder: "",
    cardNumber: "",
    expirationDate: "",
    cvv: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Error fetching product details");
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/profile");
        setUser(response.data);
        if (response.data) {
          setShippingInfo({
            name: response.data.name || "",
            email: response.data.email || "",
            phone: response.data.phone || "",
            street: response.data.address?.street || "",
            city: response.data.address?.city || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        if (err.response?.status !== 401) {
          setError("Error fetching user details");
        }
      }
    };

    fetchProduct();
    fetchUser();
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) setQuantity(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (e) => setPaymentMethod(e.target.value);

  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = ["name", "email", "phone", "street", "city"];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!shippingInfo[field]?.trim()) missingFields.push(field);
    }

    if (paymentMethod === "card") {
      const cardFields = ["cardHolder", "cardNumber", "expirationDate", "cvv"];
      for (const field of cardFields) {
        if (!paymentDetails[field]?.trim()) missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      setError(`Please fill: ${missingFields.join(", ")}`);
      return false;
    }
    return true;
  };

  const handleAddToCart = () => setShowModal(true);

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    try {
      const orderData = {
        items: [{ product: product._id, quantity, price: product.price }],
        shippingAddress: { ...shippingInfo },
        paymentMethod: paymentMethod === "card" ? "card" : paymentMethod,
        paymentDetails: paymentMethod === "card" ? paymentDetails : undefined,
        subtotal: product.price * quantity,
        shippingCost: 0,
        tax: 0,
      };

      const response = await api.post("/orders", orderData);
      const orderId =
        response.data._id || response.data.data?._id || null;
      if (orderId) navigate(`/orders/${orderId}`);
      else setError("Error creating order: Invalid response format");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Error creating order");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-red-500">{error}</div>
      </div>
    );

  if (!product)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-gray-500 dark:text-gray-300">Product not found</div>
      </div>
    );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8 transition-colors duration-300">
      <div className="container mx-auto px-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-700 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Product card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative pb-[100%] rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative pb-[100%] rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === i
                          ? "border-blue-500"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`${product.name}-${i}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-gray-500 dark:text-gray-300">{product.category?.name}</p>

              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${product.price.toFixed(2)}
                </p>
                {product.discount > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-300">{product.discount}% off</p>
                )}
              </div>

              <div className="prose max-w-none text-gray-600 dark:text-gray-300">
                <p>{product.description}</p>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold mb-2">Specifications</h3>
                  <dl className="grid grid-cols-2 gap-2">
                    {Object.entries(product.specifications).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-sm text-gray-500 dark:text-gray-300">{k}</dt>
                        <dd className="text-sm font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Quantity & Order */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-300">
                    {product.stock} in stock
                  </span>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-500 dark:text-gray-300">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors duration-300 ${
                    product.stock === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  }`}
                >
                  {product.stock === 0 ? "Out of Stock" : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-colors duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 p-6 space-y-6 text-gray-900 dark:text-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Complete Your Order</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["name", "email", "phone", "street", "city"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    type={field === "email" ? "email" : "text"}
                    name={field}
                    value={shippingInfo[field]}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    required
                  />
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Payment Method</h3>
              {["cash", "card"].map((method) => (
                <label key={method} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={handlePaymentMethodChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium">{method === "cash" ? "Cash on Delivery" : "Credit/Debit Card"}</span>
                    <span className="block text-sm text-gray-500 dark:text-gray-300">{method === "cash" ? "Pay when received" : "Secure card payment"}</span>
                  </div>
                </label>
              ))}

              {/* Card Inputs */}
              {paymentMethod === "card" && (
                <div className="space-y-3 mt-2">
                  {["cardHolder", "cardNumber"].map((field) => (
                    <input
                      key={field}
                      type="text"
                      name={field}
                      placeholder={field === "cardHolder" ? "Cardholder Name" : "Card Number"}
                      value={paymentDetails[field]}
                      onChange={handlePaymentDetailsChange}
                      className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      required
                    />
                  ))}
                  <div className="grid grid-cols-2 gap-4">
                    {["expirationDate", "cvv"].map((field) => (
                      <input
                        key={field}
                        type="text"
                        name={field}
                        placeholder={field === "expirationDate" ? "MM/YY" : "CVV"}
                        value={paymentDetails[field]}
                        onChange={handlePaymentDetailsChange}
                        className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        required
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
              <h3 className="text-lg font-semibold">Order Summary</h3>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(product.price * quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-blue-600 dark:text-blue-400">
                <span>Total</span>
                <span>${(product.price * quantity).toFixed(2)}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handlePlaceOrder}
              className="w-full py-3 px-6 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-300"
            >
              Confirm Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;