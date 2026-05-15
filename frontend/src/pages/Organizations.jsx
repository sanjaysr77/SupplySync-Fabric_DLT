import { useState, useEffect } from 'react';
import { Button, Card, Alert, Input } from '../components/common';
import { MainLayout } from '../components/layout';
import api from '../services/api';

export function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mspId: '',
    domain: '',
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/org/organizations');
      setOrganizations(response.data.organizations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organizations');
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
      await api.post('/org/organizations', formData);
      setSuccess('Organization created successfully');
      setFormData({ name: '', mspId: '', domain: '' });
      setShowForm(false);
      fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organization');
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Organization Management</h1>
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : 'Add Organization'}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Organization</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Organization Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Acme Corp"
                />

                <Input
                  label="MSP ID"
                  type="text"
                  name="mspId"
                  value={formData.mspId}
                  onChange={handleChange}
                  required
                  placeholder="AcmeMSP"
                />

                <Input
                  label="Domain"
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  required
                  placeholder="acme.example.com"
                />

                <Button type="submit" variant="primary" className="w-full">
                  Create Organization
                </Button>
              </form>
            </Card>
          )}

          <Card>
            {isLoading ? (
              <p className="text-gray-600">Loading organizations...</p>
            ) : organizations.length === 0 ? (
              <p className="text-gray-600">No organizations found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">MSP ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Domain</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((org) => (
                      <tr key={org._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{org.name}</td>
                        <td className="py-3 px-4 text-gray-600">{org.mspId}</td>
                        <td className="py-3 px-4 text-gray-600">{org.domain}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm capitalize ${
                              org.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {org.status}
                          </span>
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
