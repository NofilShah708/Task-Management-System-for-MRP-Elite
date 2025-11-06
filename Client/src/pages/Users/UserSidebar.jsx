// ...existing code...
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const navLinks = [
  { to: '/user', label: 'Dashboard', icon: <FaHome /> },
  { to: '/user/task', label: 'My Tasks', icon: <FaTasks /> },
  { to: '/user/profile', label: 'Profile', icon: <FaUser /> },
];

const UserSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleLogout = () => {
    if (!window.confirm('Logout now?')) return;
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          <FaBars />
        </button>
      )}

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col w-64 bg-white text-gray-800 border-r border-gray-200 shadow-sm transition-transform duration-300 ${
          isOpen
            ? 'fixed inset-y-0 left-0 z-40 transform translate-x-0'
            : 'hidden md:flex sticky top-0 h-screen'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
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
          {/* Close Button for Mobile */}
          <button
            onClick={closeSidebar}
            className="md:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="flex-grow p-3 overflow-y-auto">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={closeSidebar}
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
            onClick={() => {
              handleLogout();
              closeSidebar();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 transition"
            title="Logout"
          >
            <FaSignOutAlt />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default UserSidebar;
// ...existing code...