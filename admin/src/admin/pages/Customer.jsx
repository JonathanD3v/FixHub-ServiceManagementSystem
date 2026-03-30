import React, { useEffect, useState } from 'react';
import { getMethod, putMethod } from '../services/index.jsx';
import { CUSTOMERS_API, CUSTOMER_DETAIL_API, CUSTOMER_ORDERS_API } from '../services/constant.js';
import DataTable from '../components/ui/DataTable.jsx';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'isActive',
  });
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [address, setAddress] = useState({ street: '', city: '', state: '', country: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getMethod(CUSTOMERS_API);
      setCustomers(res.data?.customers || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (customer) => {
    setEditCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      status: customer.status || 'isActive',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditCustomer(null);
    setFormData({ name: '', email: '', phone: '', status: 'isActive' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (editCustomer && editCustomer.address) {
      setAddress({
        street: editCustomer.address.street || '',
        city: editCustomer.address.city || '',
        state: editCustomer.address.state || '',
        country: editCustomer.address.country || '',
      });
    } else {
      setAddress({ street: '', city: '', state: '', country: '' });
    }
  }, [editCustomer]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCustomer) {
        await putMethod(CUSTOMER_DETAIL_API(editCustomer._id), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: address,
        });
        toast.success('Customer updated');
        fetchCustomers();
        closeModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update customer');
    }
  };

  const openOrdersModal = async (customer) => {
    setSelectedCustomer(customer);
    setOrdersModalOpen(true);
    setOrdersLoading(true);
    try {
      const res = await getMethod(CUSTOMER_ORDERS_API(customer._id));
      setOrders(res.data?.orders || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch customer orders');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const closeOrdersModal = () => {
    setOrdersModalOpen(false);
    setSelectedCustomer(null);
    setOrders([]);
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Address', accessor: 'address' },
    { header: 'Active', accessor: 'isActive', Cell: row => (row.isActive ? 'Yes' : 'No') },
    { header: 'Created At', accessor: 'createdAt', Cell: row => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-') },
    {
      header: 'Actions',
      accessor: 'actions',
      Cell: (row) => (
        <div className="flex gap-2">
          <button
            className="text-indigo-600 hover:underline"
            onClick={e => {
              e.stopPropagation();
              openEditModal(row.actions);
            }}
          >Edit</button>
          <button
            className="text-green-600 hover:underline"
            onClick={e => {
              e.stopPropagation();
              openOrdersModal(row.actions);
            }}
          >Orders</button>
        </div>
      ),
    },
  ];

  const tableData = customers.map(c => ({
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address ? [c.address.street, c.address.city, c.address.state, c.address.country].filter(Boolean).join(', ') : '',
    isActive: c.isActive,
    createdAt: c.createdAt,
    actions: c,
  }));

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={tableData} onRowClick={openEditModal} />
        )}
      </div>
      {/* Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="street"
                  value={address.street}
                  onChange={handleAddressChange}
                  placeholder="Street"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  name="city"
                  value={address.city}
                  onChange={handleAddressChange}
                  placeholder="City"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  name="state"
                  value={address.state}
                  onChange={handleAddressChange}
                  placeholder="State"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  name="country"
                  value={address.country}
                  onChange={handleAddressChange}
                  placeholder="Country"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Orders Modal */}
      {ordersModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">{selectedCustomer?.name}'s Orders</h2>
            {ordersLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map(order => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderNumber || order._id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.total?.toFixed(2) ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">No orders found for this customer.</div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={closeOrdersModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
