import { useState } from 'react';
import { Button, Input, Card, Alert } from '../components/common';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { MainLayout } from '../components/layout';

export function Profile() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword(formData.oldPassword, formData.newPassword);
      setSuccess('Password changed successfully!');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Profile</h1>

          <Card className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900 mt-1">{user?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="text-gray-900 mt-1 capitalize">{user?.role}</p>
              </div>
              {user?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900 mt-1">{user.phone}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>

            {error && (
              <Alert type="error" message={error} onClose={() => setError('')} />
            )}

            {success && (
              <Alert type="success" message={success} onClose={() => setSuccess('')} />
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 mt-6">
              <Input
                label="Current Password"
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />

              <Input
                label="New Password"
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />

              <p className="text-sm text-gray-600">
                Password must be at least 8 characters long.
              </p>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Change Password'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
