// ...existing code...
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUser, FaSignOutAlt } from 'react-icons/fa';

const navLinks = [
  { to: '/user', label: 'Dashboard', icon: <FaHome /> },
  { to: '/user/task', label: 'My Tasks', icon: <FaTasks /> },
  { to: '/user/profile', label: 'Profile', icon: <FaUser /> },
];

const UserSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (!window.confirm('Logout now?')) return;
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    // make sidebar sticky and full viewport height; keep light theme like admin
    <aside className="hidden md:flex flex-col w-64 bg-white text-gray-800 border-r border-gray-200 shadow-sm sticky top-0 h-screen">
      <div className="flex items-center h-16 px-4 border-b border-gray-100">
        <div>
          <div
            className="text-sm font-semibold"
            style={{
              fontSize: '30px',
              color: '#00287fff',
              fontWeight: 'bold',
            }}
          >
            Dashboard
          </div>
        </div>
      </div>

      <nav className="flex-grow p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-gray-50 text-blue-900 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-900'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 transition"
          title="Logout"
        >
          <FaSignOutAlt />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default UserSidebar;
// ...existing code...