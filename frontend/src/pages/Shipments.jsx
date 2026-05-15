import { useState, useEffect } from 'react';
import { Button, Card, Alert, Input } from '../components/common';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function Shipments() {
  const { user } = useAuthStore();
  const [shipments, setShipments] = useState([]);
  const [pos, setPos] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [formData, setFormData] = useState({
    shipmentId: '',
    poId: '',
    shipper: '',
    receiver: '',
    items: [{ sku: '', description: '', quantity: 0 }],
    trackingNumber: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [shipmentsRes, posRes, orgsRes] = await Promise.all([
        api.get('/shipment/list'),
        api.get('/po/list'),
        api.get('/org/organizations'),
      ]);
      setShipments(shipmentsRes.data.shipments || []);
      setPos(posRes.data.purchaseOrders || []);
      setOrganizations(orgsRes.data.organizations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { sku: '', description: '', quantity: 0 }],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.shipmentId || !formData.poId || !formData.shipper || !formData.receiver) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      await api.post('/shipment/create', formData);
      setSuccess('Shipment created successfully');
      setFormData({
        shipmentId: '',
        poId: '',
        shipper: '',
        receiver: '',
        items: [{ sku: '', description: '', quantity: 0 }],
        trackingNumber: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shipment');
    }
  };

  const handleUpdateStatus = async (shipmentId, newStatus) => {
    try {
      await api.put(`/shipment/${shipmentId}/status`, { status: newStatus });
      setSuccess('Shipment status updated');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update shipment status');
    }
  };

  const handleTrackShipment = async (shipmentId) => {
    try {
      const response = await api.get(`/shipment/${shipmentId}/track`);
      setSelectedShipment(response.data.data);
      setShowTrackingModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to track shipment');
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
              onClick={() => {
                setShowForm(!showForm);
                setFormData({
                  shipmentId: '',
                  poId: '',
                  shipper: '',
                  receiver: '',
                  items: [{ sku: '', description: '', quantity: 0 }],
                  trackingNumber: '',
                });
              }}
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
                    label="Tracking Number"
                    type="text"
                    name="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={handleChange}
                    placeholder="TRK-001"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Order
                    </label>
                    <select
                      name="poId"
                      value={formData.poId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select PO...</option>
                      {pos.map((po) => (
                        <option key={po._id} value={po._id}>
                          {po.poId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipper Organization
                    </label>
                    <select
                      name="shipper"
                      value={formData.shipper}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select shipper...</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Receiver Organization
                    </label>
                    <select
                      name="receiver"
                      value={formData.receiver}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select receiver...</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                    <Button variant="secondary" size="sm" onClick={addItem} type="button">
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            label="SKU"
                            type="text"
                            value={item.sku}
                            onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                            placeholder="SKU"
                          />
                          <Input
                            label="Description"
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(index, 'description', e.target.value)
                            }
                            placeholder="Description"
                          />
                          <Input
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        {formData.items.length > 1 && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeItem(index)}
                            type="button"
                          >
                            Remove Item
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
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
                <option value="pending">Pending</option>
                <option value="in-transit">In Transit</option>
                <option value="delivered">Delivered</option>
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Shipment ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Tracking #
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Shipper
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Receiver
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.map((shipment) => (
                      <tr key={shipment._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-mono">
                          {shipment.shipmentId}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{shipment.trackingNumber}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {shipment.shipper?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {shipment.receiver?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm capitalize ${
                              shipment.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : shipment.status === 'in-transit'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {shipment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleTrackShipment(shipment._id)}
                          >
                            Track
                          </Button>
                          {shipment.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateStatus(shipment._id, 'in-transit')}
                            >
                              Ship
                            </Button>
                          )}
                          {shipment.status === 'in-transit' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateStatus(shipment._id, 'delivered')}
                            >
                              Deliver
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {showTrackingModal && selectedShipment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Shipment Tracking</h2>
                  <button
                    onClick={() => setShowTrackingModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Shipment ID
                    </label>
                    <p className="text-gray-900 mt-1">{selectedShipment.shipmentId}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tracking Number
                    </label>
                    <p className="text-gray-900 mt-1">{selectedShipment.trackingNumber}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="text-gray-900 mt-1 capitalize">{selectedShipment.status}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Created At
                    </label>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedShipment.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <div className="mt-2 space-y-2">
                      {selectedShipment.items?.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          {item.sku} - {item.description} (Qty: {item.quantity})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full mt-6"
                  onClick={() => setShowTrackingModal(false)}
                >
                  Close
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
