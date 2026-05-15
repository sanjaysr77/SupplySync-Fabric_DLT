import { useState, useEffect } from 'react';
import { Button, Card, Alert, Input } from '../components/common';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function DPP() {
  const { user } = useAuthStore();
  const [dpps, setDpps] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDPP, setSelectedDPP] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    manufacturerId: '',
    manufacturerName: '',
    certifications: [],
    metadata: {},
  });
  const [certificationInput, setCertificationInput] = useState('');
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dppsRes, productsRes] = await Promise.all([
        api.get('/dpp/list/all'),
        api.get('/product/list'),
      ]);
      setDpps(dppsRes.data.dpps || []);
      setProducts(productsRes.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'productId') {
      const product = products.find((p) => p._id === value);
      setFormData((prev) => ({
        ...prev,
        productId: value,
        productName: product?.name || '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addCertification = () => {
    if (certificationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()],
      }));
      setCertificationInput('');
    }
  };

  const removeCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const addMetadata = () => {
    if (metadataKey.trim() && metadataValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataKey.trim()]: metadataValue.trim(),
        },
      }));
      setMetadataKey('');
      setMetadataValue('');
    }
  };

  const removeMetadata = (key) => {
    setFormData((prev) => {
      const newMetadata = { ...prev.metadata };
      delete newMetadata[key];
      return { ...prev, metadata: newMetadata };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.productId || !formData.manufacturerName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/dpp/create', formData);
      setSuccess('DPP record created successfully');
      setFormData({
        productId: '',
        productName: '',
        manufacturerId: '',
        manufacturerName: '',
        certifications: [],
        metadata: {},
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create DPP record');
    }
  };

  const handleViewDetails = async (dppId) => {
    try {
      const response = await api.get(`/dpp/${dppId}`);
      setSelectedDPP(response.data.data);
      setShowDetailModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch DPP details');
    }
  };

  const handleVerifyDPP = async (dppId) => {
    try {
      const response = await api.get(`/dpp/${dppId}/verify`);
      setSuccess('DPP verified successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify DPP');
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Digital Product Passports</h1>
            <Button
              variant="primary"
              onClick={() => {
                setShowForm(!showForm);
                setFormData({
                  productId: '',
                  productName: '',
                  manufacturerId: '',
                  manufacturerName: '',
                  certifications: [],
                  metadata: {},
                });
              }}
            >
              {showForm ? 'Cancel' : 'Create DPP'}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New DPP Record</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Manufacturer Name"
                    type="text"
                    name="manufacturerName"
                    value={formData.manufacturerName}
                    onChange={handleChange}
                    required
                    placeholder="Manufacturer Name"
                  />
                </div>

                <Input
                  label="Manufacturer ID"
                  type="text"
                  name="manufacturerId"
                  value={formData.manufacturerId}
                  onChange={handleChange}
                  placeholder="MFG-001"
                />

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                  <div className="flex gap-2 mb-4">
                    <Input
                      type="text"
                      value={certificationInput}
                      onChange={(e) => setCertificationInput(e.target.value)}
                      placeholder="Add certification (e.g., ISO 9001)"
                    />
                    <Button
                      variant="secondary"
                      onClick={addCertification}
                      type="button"
                      className="whitespace-nowrap"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-blue-50 p-3 rounded-lg"
                      >
                        <span className="text-gray-900">{cert}</span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeCertification(idx)}
                          type="button"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <Input
                      type="text"
                      value={metadataKey}
                      onChange={(e) => setMetadataKey(e.target.value)}
                      placeholder="Key"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={metadataValue}
                        onChange={(e) => setMetadataValue(e.target.value)}
                        placeholder="Value"
                      />
                      <Button
                        variant="secondary"
                        onClick={addMetadata}
                        type="button"
                        className="whitespace-nowrap"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(formData.metadata).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center bg-green-50 p-3 rounded-lg"
                      >
                        <span className="text-gray-900">
                          <strong>{key}:</strong> {value}
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeMetadata(key)}
                          type="button"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  Create DPP Record
                </Button>
              </form>
            </Card>
          )}

          <Card>
            {isLoading ? (
              <p className="text-gray-600">Loading DPP records...</p>
            ) : dpps.length === 0 ? (
              <p className="text-gray-600">No DPP records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Product Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Product ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Manufacturer
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Certifications
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dpps.map((dpp) => (
                      <tr key={dpp._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{dpp.productName}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono">{dpp.productId}</td>
                        <td className="py-3 px-4 text-gray-600">{dpp.manufacturerName}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {dpp.certifications?.map((cert, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDetails(dpp._id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleVerifyDPP(dpp._id)}
                          >
                            Verify
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {showDetailModal && selectedDPP && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">DPP Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product Name
                    </label>
                    <p className="text-gray-900 mt-1">{selectedDPP.productName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product ID
                    </label>
                    <p className="text-gray-900 mt-1">{selectedDPP.productId}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Manufacturer
                    </label>
                    <p className="text-gray-900 mt-1">{selectedDPP.manufacturerName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Certifications
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedDPP.certifications?.map((cert, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {Object.keys(selectedDPP.metadata || {}).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Metadata</label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(selectedDPP.metadata).map(([key, value]) => (
                          <div key={key} className="text-sm text-gray-600">
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Created At
                    </label>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedDPP.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full mt-6"
                  onClick={() => setShowDetailModal(false)}
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
