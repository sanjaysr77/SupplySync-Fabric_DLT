import { useState, useEffect } from 'react';
import { Button, Card, Alert, Input } from '../components/common';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function PurchaseOrders() {
  const { user } = useAuthStore();
  const [pos, setPos] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    poId: '',
    buyer: '',
    seller: '',
    items: [{ sku: '', description: '', quantity: 0, unitPrice: 0 }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [posRes, orgsRes, productsRes] = await Promise.all([
        api.get('/po/list'),
        api.get('/org/organizations'),
        api.get('/product/list'),
      ]);
      setPos(posRes.data.purchaseOrders || []);
      setOrganizations(orgsRes.data.organizations || []);
      setProducts(productsRes.data.products || []);
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
      items: [...prev.items, { sku: '', description: '', quantity: 0, unitPrice: 0 }],
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

    if (!formData.poId || !formData.buyer || !formData.seller) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      const totalAmount = formData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      const payload = {
        ...formData,
        totalAmount,
      };

      if (editingId) {
        await api.put(`/po/${editingId}`, payload);
        setSuccess('Purchase order updated successfully');
      } else {
        await api.post('/po/create', payload);
        setSuccess('Purchase order created successfully');
      }

      setFormData({
        poId: '',
        buyer: '',
        seller: '',
        items: [{ sku: '', description: '', quantity: 0, unitPrice: 0 }],
      });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save purchase order');
    }
  };

  const handleApprovePO = async (poId) => {
    try {
      await api.put(`/po/${poId}/approve`);
      setSuccess('Purchase order approved');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve PO');
    }
  };

  const handleRejectPO = async (poId) => {
    try {
      await api.put(`/po/${poId}/reject`);
      setSuccess('Purchase order rejected');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject PO');
    }
  };

  const filteredPos = statusFilter === 'all' ? pos : pos.filter((p) => p.status === statusFilter);

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Purchase Orders</h1>
            <Button
              variant="primary"
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({
                  poId: '',
                  buyer: '',
                  seller: '',
                  items: [{ sku: '', description: '', quantity: 0, unitPrice: 0 }],
                });
              }}
            >
              {showForm ? 'Cancel' : 'Create PO'}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'Edit Purchase Order' : 'Create New Purchase Order'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="PO ID"
                    type="text"
                    name="poId"
                    value={formData.poId}
                    onChange={handleChange}
                    required
                    placeholder="PO-001"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buyer Organization
                    </label>
                    <select
                      name="buyer"
                      value={formData.buyer}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select buyer...</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seller Organization
                    </label>
                    <select
                      name="seller"
                      value={formData.seller}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select seller...</option>
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                          <Input
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <Input
                            label="Unit Price"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            step="0.01"
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
                  {editingId ? 'Update PO' : 'Create PO'}
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
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </Card>

          <Card>
            {isLoading ? (
              <p className="text-gray-600">Loading purchase orders...</p>
            ) : filteredPos.length === 0 ? (
              <p className="text-gray-600">No purchase orders found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">PO ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Buyer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Seller</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Total Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPos.map((po) => (
                      <tr key={po._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-mono">{po.poId}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {po.buyer?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {po.seller?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-900">${po.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm capitalize ${
                              po.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : po.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : po.status === 'submitted'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          {user?.role === 'approver' && po.status === 'submitted' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprovePO(po._id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRejectPO(po._id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {po.status === 'draft' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setFormData(po);
                                setEditingId(po._id);
                                setShowForm(true);
                              }}
                            >
                              Edit
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
        </div>
      </div>
    </MainLayout>
  );
}
