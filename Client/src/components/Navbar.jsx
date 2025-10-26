import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="bg-blue-900 text-white shadow-md">
      <div className="flex items-center justify-between p-2 max-w-7xl mx-auto">
        {/* Logo Section */}
        <div className="flex items-center">
          {/* <img src="/path/to/logo.png" alt="Logo" className="h-8 mr-2" /> Add your logo path here */}
          <h1 className="text-xl font-bold">MRP ELITE</h1>
        </div>
        <nav className="flex space-x-4">
          <h1>TASK MANAGEMENT SYSTEM</h1>
        </nav>
      </div>
    </div>
  );
}

export default Navbar;