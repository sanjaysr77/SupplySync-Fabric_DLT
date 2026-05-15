import { useState, useEffect } from 'react';
import { Button, Card, Alert, Input } from '../components/common';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function Products() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    category: '',
    manufacturer: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/product/list');
      setProducts(response.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
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

    try {
      if (editingId) {
        await api.put(`/product/${editingId}`, formData);
        setSuccess('Product updated successfully');
      } else {
        await api.post('/product/create', formData);
        setSuccess('Product created successfully');
      }
      setFormData({
        sku: '',
        name: '',
        description: '',
        price: '',
        category: '',
        manufacturer: '',
      });
      setShowForm(false);
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/product/${productId}`);
      setSuccess('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Products</h1>
            {user?.role === 'admin' && (
              <Button
                variant="primary"
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({
                    sku: '',
                    name: '',
                    description: '',
                    price: '',
                    category: '',
                    manufacturer: '',
                  });
                }}
              >
                {showForm ? 'Cancel' : 'Add Product'}
              </Button>
            )}
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          )}

          {showForm && user?.role === 'admin' && (
            <Card className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'Edit Product' : 'Create New Product'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="SKU"
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  placeholder="PROD-001"
                />

                <Input
                  label="Product Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Product Name"
                />

                <Input
                  label="Description"
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description"
                />

                <Input
                  label="Price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  step="0.01"
                />

                <Input
                  label="Category"
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Category"
                />

                <Input
                  label="Manufacturer"
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="Manufacturer"
                />

                <Button type="submit" variant="primary" className="w-full">
                  {editingId ? 'Update Product' : 'Create Product'}
                </Button>
              </form>
            </Card>
          )}

          <Card className="mb-8">
            <Input
              label="Search Products"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or SKU..."
            />
          </Card>

          <Card>
            {isLoading ? (
              <p className="text-gray-600">Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-gray-600">No products found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">SKU</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Manufacturer</th>
                      {user?.role === 'admin' && (
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-mono">{product.sku}</td>
                        <td className="py-3 px-4 text-gray-900">{product.name}</td>
                        <td className="py-3 px-4 text-gray-600">{product.category}</td>
                        <td className="py-3 px-4 text-gray-900">${product.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-gray-600">{product.manufacturer}</td>
                        {user?.role === 'admin' && (
                          <td className="py-3 px-4 space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              Delete
                            </Button>
                          </td>
                        )}
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
