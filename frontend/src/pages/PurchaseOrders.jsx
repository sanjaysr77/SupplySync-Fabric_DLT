import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert, Input } from '../components/common';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function PurchaseOrders() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
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
    productId: '',
    quantity: 0,
    requestedDeliveryDate: '',
    linkedRetailerPOId: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [posRes, orgsRes, productsRes] = await Promise.all([
        api.get('/po/list').catch(err => ({ error: 'PO list', details: err })),
        api.get('/org/organizations').catch(err => ({ error: 'Organizations', details: err })),
        api.get('/product/list').catch(err => ({ error: 'Products', details: err })),
      ]);
      
      if (posRes.error) {
        setError(`Failed to fetch ${posRes.error}: ${posRes.details.response?.data?.message || posRes.details.message}`);
        setPos([]);
      } else {
        setPos(posRes.data.purchaseOrders || []);
      }
      
      if (orgsRes.error) {
        setError(`Failed to fetch ${orgsRes.error}: ${orgsRes.details.response?.data?.message || orgsRes.details.message}`);
        setOrganizations([]);
      } else {
        setOrganizations(orgsRes.data.organizations || []);
      }
      
      if (productsRes.error) {
        setError(`Failed to fetch ${productsRes.error}: ${productsRes.details.response?.data?.message || productsRes.details.message}`);
        setProducts([]);
      } else {
        setProducts(productsRes.data.products || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
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

    if (!formData.poId || !formData.productId || !formData.quantity || !formData.requestedDeliveryDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        poId: formData.poId,
        productId: formData.productId,
        quantity: formData.quantity,
        requestedDeliveryDate: formData.requestedDeliveryDate,
        linkedRetailerPOId: formData.linkedRetailerPOId || undefined,
        notes: formData.notes || undefined,
      };

      await api.post('/po/create', payload);
      setSuccess('Purchase order created successfully');

      setFormData({
        poId: '',
        productId: '',
        quantity: 0,
        requestedDeliveryDate: '',
        linkedRetailerPOId: '',
        notes: '',
      });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const handleApprovePO = async (poId) => {
    try {
      await api.put(`/po/${poId}/approve`);
      setSuccess('Purchase order approved successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve PO');
    }
  };

  const handleRejectPO = async (poId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await api.put(`/po/${poId}/reject`, { reason });
      setSuccess('Purchase order rejected successfully');
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Purchase Order</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Product
                    </label>
                    <select
                      name="productId"
                      value={formData.productId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select product...</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

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
                    label="Requested Delivery Date"
                    type="date"
                    name="requestedDeliveryDate"
                    value={formData.requestedDeliveryDate}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Linked Retailer PO ID (if distributor)"
                    type="text"
                    name="linkedRetailerPOId"
                    value={formData.linkedRetailerPOId}
                    onChange={handleChange}
                    placeholder="PO-001"
                  />

                  <Input
                    label="Notes"
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional notes..."
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  Create PO
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Delivery Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPos.map((po) => (
                      <tr key={po._id || po.poId} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/purchase-orders/${po.poId}`)}>
                        <td className="py-3 px-4 text-gray-900 font-mono font-semibold">{po.poId}</td>
                        <td className="py-3 px-4 text-gray-600">{po.productId}</td>
                        <td className="py-3 px-4 text-gray-600 font-semibold">{po.quantity}</td>
                        <td className="py-3 px-4 text-gray-600">{po.requestedDeliveryDate}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-sm capitalize font-medium bg-blue-100 text-blue-800">
                            {po.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/purchase-orders/${po.poId}`);
                            }}
                          >
                            View Details
                          </Button>
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
