import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaTasks,
  FaUser,
  FaChartLine,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { IoCreate } from "react-icons/io5";
import { HiBuildingOffice } from "react-icons/hi2";

const AdminSidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: "/admin/", label: "Dashboard", icon: <FaHome /> },
    { to: "/admin/profile", label: "Profile", icon: <FaUserCircle /> },
    { to: "/admin/departments", label: "Departments", icon: <HiBuildingOffice  /> },
    { to: "/admin/task/read", label: "View Tasks", icon: <FaChartLine /> },
    { to: "/admin/task/create", label: "Create Task", icon: <FaTasks /> },
    { to: "/admin/users", label: "Users", icon: <FaUser /> },
    { to: "/admin/departments/create", label: "Create Department", icon: <HiBuildingOffice  /> },
    { to: "/admin/users/create", label: "Create User", icon: <IoCreate  /> },


  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-white rounded-md shadow-md text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          {isOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-md transition-transform duration-300 ease-in-out md:flex md:flex-col md:h-screen md:sticky md:top-0`}
      >
        {/* Navigation */}
        <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeSidebar}
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
            onClick={closeSidebar}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
          >
            <FaSignOutAlt className="text-lg" />
            Logout
          </Link>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30"
          onClick={closeSidebar}
        ></div>
      )}
    </>
  );
};

export default AdminSidebar;
