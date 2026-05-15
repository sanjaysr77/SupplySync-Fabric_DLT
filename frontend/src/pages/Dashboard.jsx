import { useAuthStore } from '../store/authStore';
import { Card } from '../components/common';
import { MainLayout } from '../components/layout';

export function Dashboard() {
  const { user } = useAuthStore();

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              Role: <span className="font-semibold capitalize">{user?.role}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">—</div>
                <p className="text-gray-600 mt-2">Purchase Orders</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">—</div>
                <p className="text-gray-600 mt-2">Shipments</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">—</div>
                <p className="text-gray-600 mt-2">Products</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">—</div>
                <p className="text-gray-600 mt-2">DPP Records</p>
              </div>
            </Card>
          </div>

          <Card className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-600">
              Use the sidebar to navigate to different sections of the application.
            </p>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
