import { useState, useEffect } from 'react';
import { Button, Card, Alert, Input } from '../components/common';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function Shipments() {
  const { user } = useAuthStore();
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    shipmentId: '',
    retailerPoId: '',
    distributorPoId: '',
    productId: '',
    quantity: 0,
    promisedRetailerDeliveryDate: '',
    distributorDispatchDate: '',
    expectedRetailerDeliveryDate: '',
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/shipment/list');
      setShipments(response.data.shipments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch shipments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (
      !formData.shipmentId ||
      !formData.retailerPoId ||
      !formData.distributorPoId ||
      !formData.productId ||
      !formData.quantity ||
      !formData.promisedRetailerDeliveryDate ||
      !formData.distributorDispatchDate ||
      !formData.expectedRetailerDeliveryDate
    ) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/shipment/create', formData);
      setSuccess('Shipment created successfully');
      setFormData({
        shipmentId: '',
        retailerPoId: '',
        distributorPoId: '',
        productId: '',
        quantity: 0,
        promisedRetailerDeliveryDate: '',
        distributorDispatchDate: '',
        expectedRetailerDeliveryDate: '',
      });
      setShowForm(false);
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shipment');
    }
  };

  const handleMarkDelivered = async (shipmentId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.put(`/shipment/${shipmentId}/status`, { actualDeliveryDate: today });
      setSuccess('Shipment marked as delivered');
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark delivery');
    }
  };

  const filteredShipments =
    statusFilter === 'all'
      ? shipments
      : shipments.filter((s) => s.status === statusFilter);

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Shipments</h1>
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : 'Create Shipment'}
            </Button>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          )}

          {showForm && (
            <Card className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Shipment</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Shipment ID"
                    type="text"
                    name="shipmentId"
                    value={formData.shipmentId}
                    onChange={handleChange}
                    required
                    placeholder="SHIP-001"
                  />

                  <Input
                    label="Retailer PO ID"
                    type="text"
                    name="retailerPoId"
                    value={formData.retailerPoId}
                    onChange={handleChange}
                    required
                    placeholder="PO-001"
                  />

                  <Input
                    label="Distributor PO ID"
                    type="text"
                    name="distributorPoId"
                    value={formData.distributorPoId}
                    onChange={handleChange}
                    required
                    placeholder="DIST-001"
                  />

                  <Input
                    label="Product ID"
                    type="text"
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                    required
                    placeholder="Product ID"
                  />

                  <Input
                    label="Quantity"
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    placeholder="100"
                    min="1"
                  />

                  <Input
                    label="Promised Retailer Delivery Date"
                    type="date"
                    name="promisedRetailerDeliveryDate"
                    value={formData.promisedRetailerDeliveryDate}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Distributor Dispatch Date"
                    type="date"
                    name="distributorDispatchDate"
                    value={formData.distributorDispatchDate}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Expected Retailer Delivery Date"
                    type="date"
                    name="expectedRetailerDeliveryDate"
                    value={formData.expectedRetailerDeliveryDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  Create Shipment
                </Button>
              </form>
            </Card>
          )}

          <Card className="mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="CREATED">Created</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </Card>

          <Card>
            {isLoading ? (
              <p className="text-gray-600">Loading shipments...</p>
            ) : filteredShipments.length === 0 ? (
              <p className="text-gray-600">No shipments found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Shipment ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Retailer PO</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Distributor PO</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.map((shipment) => (
                      <tr key={shipment.shipmentId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-mono">{shipment.shipmentId}</td>
                        <td className="py-3 px-4 text-gray-600">{shipment.retailerPoId}</td>
                        <td className="py-3 px-4 text-gray-600">{shipment.distributorPoId}</td>
                        <td className="py-3 px-4 text-gray-600">{shipment.productId}</td>
                        <td className="py-3 px-4 text-gray-600">{shipment.quantity}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm capitalize ${
                              shipment.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-800'
                                : shipment.status === 'IN_TRANSIT'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {shipment.status || 'CREATED'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {user?.organization?.domain?.includes('retailer') && (
                            (shipment.status && shipment.status.startsWith && shipment.status.startsWith('DELIVERED')) ? (
                              <Button variant="secondary" size="sm" disabled>
                                {shipment.status === 'DELIVERED_ON_TIME'
                                  ? 'Delivered (On time)'
                                  : shipment.status === 'DELIVERED_LATE'
                                  ? 'Delivered (Late)'
                                  : 'Delivered'}
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleMarkDelivered(shipment.shipmentId)}
                              >
                                Mark Delivered
                              </Button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
