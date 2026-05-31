import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['admin', 'user', 'approver'] },
    { path: '/products', label: 'Products', roles: ['admin', 'user', 'approver'] },
    { path: '/inventory', label: 'Inventory', roles: ['admin', 'user', 'approver'] },
    { path: '/purchase-orders', label: 'Purchase Orders', roles: ['admin', 'user', 'approver'] },
    { path: '/shipments', label: 'Shipments', roles: ['admin', 'user', 'approver'] },
    { path: '/dpp', label: 'DPP Records', roles: ['admin', 'user', 'approver'] },
    { path: '/analytics', label: 'Analytics', roles: ['admin', 'user', 'approver'] },
    { path: '/users', label: 'Users', roles: ['admin'] },
    { path: '/organizations', label: 'Organizations', roles: ['admin'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Fresh-Flow</h1>
        <p className="text-sm text-gray-400 mt-1">Blockchain Enabled</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-2 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <Link
          to="/profile"
          className={`block px-4 py-2 rounded-lg transition-colors ${
            isActive('/profile')
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          Profile
        </Link>
        <button
          onClick={logout}
          className="w-full text-left px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
