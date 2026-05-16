import { useState, useEffect } from 'react';
import { Button, Card, Alert, Input } from '../components/common';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function Inventory() {
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    warehouseLocation: 'Main Warehouse',
    notes: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user?.organization) {
        setError('Organization not assigned');
        return;
      }

      const response = await api.get(`/inventory/org/${user.organization}`);
      setInventory(response.data.inventory || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
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

    if (!formData.productId || !formData.quantity) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/inventory/add', {
        productId: formData.productId,
        organizationId: user.organization,
        quantity: Number(formData.quantity),
        warehouseLocation: formData.warehouseLocation,
        notes: formData.notes,
      });

      setSuccess('Stock added successfully');
      setFormData({
        productId: '',
        quantity: '',
        warehouseLocation: 'Main Warehouse',
        notes: '',
      });
      setShowAddForm(false);
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterLowStock || item.available <= item.reorderLevel;
    
    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (item) => {
    if (item.available <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.available <= item.reorderLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Inventory Management</h1>
            <Button
              variant="primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : 'Add Stock'}
            </Button>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          )}

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-blue-50">
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium">Total Items</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{summary.totalItems}</p>
                </div>
              </Card>
              <Card className="bg-green-50">
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium">Total Quantity</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{summary.totalQuantity}</p>
                </div>
              </Card>
              <Card className="bg-purple-50">
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium">Available</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{summary.totalAvailable}</p>
                </div>
              </Card>
              <Card className="bg-orange-50">
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium">Reserved</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{summary.totalReserved}</p>
                </div>
              </Card>
              <Card className="bg-red-50">
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium">Low Stock</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{summary.lowStockItems}</p>
                </div>
              </Card>
            </div>
          )}

          {showAddForm && (
            <Card className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Stock</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product *
                    </label>
                    <select
                      name="productId"
                      value={formData.productId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select product...</option>
                      {inventory.map((item) => (
                        <option key={item.product._id} value={item.product._id}>
                          {item.product.sku} - {item.product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Quantity *"
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    placeholder="100"
                    min="1"
                  />

                  <Input
                    label="Warehouse Location"
                    type="text"
                    name="warehouseLocation"
                    value={formData.warehouseLocation}
                    onChange={handleChange}
                    placeholder="Main Warehouse"
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
                  Add Stock
                </Button>
              </form>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Search Products"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or SKU..."
              />
              <div className="flex items-end">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterLowStock}
                    onChange={(e) => setFilterLowStock(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Show Low Stock Only</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Inventory Table */}
          <Card>
            {isLoading ? (
              <p className="text-gray-600">Loading inventory...</p>
            ) : filteredInventory.length === 0 ? (
              <p className="text-gray-600">No inventory found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">SKU</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Total Qty</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Reserved</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Available</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Reorder Level</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const status = getStockStatus(item);
                      return (
                        <tr key={item._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900 font-mono text-sm">{item.product.sku}</td>
                          <td className="py-3 px-4 text-gray-900">{item.product.name}</td>
                          <td className="py-3 px-4 text-center text-gray-600 font-semibold">{item.quantity}</td>
                          <td className="py-3 px-4 text-center text-orange-600 font-semibold">{item.reserved}</td>
                          <td className="py-3 px-4 text-center text-green-600 font-semibold">{item.available}</td>
                          <td className="py-3 px-4 text-center text-gray-600">{item.reorderLevel}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">{item.warehouseLocation}</td>
                        </tr>
                      );
                    })}
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
