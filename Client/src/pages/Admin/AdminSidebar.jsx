import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaTasks,
  FaUser,
  FaChartLine,
  FaSignOutAlt,
} from "react-icons/fa";
import { IoCreate } from "react-icons/io5";

const AdminSidebar = () => {
  const location = useLocation();

  const links = [
    { to: "/admin/", label: "Dashboard", icon: <FaHome /> },
    { to: "/admin/task/create", label: "Create Task", icon: <FaTasks /> },
    { to: "/admin/task/read", label: "View Tasks", icon: <FaChartLine /> },
    { to: "/admin/users", label: "Users", icon: <FaUser /> },
    { to: "/admin/users/create", label: "Create User", icon: <IoCreate  /> },

  ];

  return (
    <div className="hidden md:flex flex-col h-screen w-64 bg-white border-r border-gray-200 shadow-md sticky top-0">


      {/* Navigation */}
      <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-900 text-white shadow-md"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-900"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
        >
          <FaSignOutAlt className="text-lg" />
          Logout
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;
