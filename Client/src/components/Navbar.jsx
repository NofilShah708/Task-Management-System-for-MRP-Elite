import React from 'react';
import { Link } from 'react-router-dom';
import Logo from'../assets/MRP-Elite Logo.png'

const Navbar = () => {
  return (
    <div className="bg-blue-900 text-white shadow-md">
      <div className="flex items-center justify-between p-2 md:p-2 max-w-7xl mx-auto">
        {/* Logo Section */}
        <div className="flex items-center">
          <img src={Logo} alt="Logo" className="h-8 mr-2" />
        </div>
        <nav className="flex space-x-2 md:space-x-4">
          <h1 className="text-sm md:text-base">TASK MANAGEMENT SYSTEM</h1>
        </nav>
      </div>
    </div>
  );
}

export default Navbar;