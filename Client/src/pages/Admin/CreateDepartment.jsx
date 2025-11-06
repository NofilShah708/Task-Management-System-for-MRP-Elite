import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';

const CreateDepartment = () => {
  const [departmentData, setDepartmentData] = useState({
    name: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setDepartmentData({ ...departmentData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:4041/admin/departments',
        departmentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      setMessage('✅ Department created successfully!');
      setDepartmentData({
        name: '',
        description: '',
      });
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Failed to create department'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto bg-white shadow-lg p-4 md:p-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 text-center">
            Create New Department
          </h1>

          {message && (
            <div className={`mb-4 p-3 text-center ${
              message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Department Name *
              </label>
              <input
                type="text"
                name="name"
                value={departmentData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={departmentData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 text-white font-semibold ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-900'
              } transition-colors`}
            >
              {loading ? 'Creating...' : 'Create Department'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateDepartment;
