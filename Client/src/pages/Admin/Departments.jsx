import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import { motion } from "framer-motion";
import { Loader2, Building, Users, ClipboardList, Search } from "lucide-react";

const Departments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:4041/admin/departments", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setDepartments(res.data.departments || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setError('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <AdminSidebar />

      <div className="flex-grow p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-blue-900">
            All Departments Overview
          </h1>
          <div className="relative mt-4 sm:mt-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            <span className="ml-3 text-gray-700 text-lg font-medium">
              Loading departments...
            </span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            {departments.length === 0 ? (
              <p className="text-center text-gray-600 mt-10 text-lg">
                No departments found.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.filter(department => (department.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((department, index) => (
                  <motion.div
                    key={department._id || index}
                    whileHover={{ scale: 1.05 }}
                    className="relative bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Department Name */}
                    <div className="flex items-center mb-6">
                      <Building className="w-8 h-8 mr-4 text-blue-500" />
                      <h2 className="text-2xl font-bold text-gray-800">
                        {department.name}
                      </h2>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-base mb-6 leading-relaxed">
                      {department.description || 'No description provided'}
                    </p>

                    {/* Created At */}
                    <div className="flex items-center text-gray-500 text-sm mb-6">
                      <span>
                        Created: {new Date(department.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/departments/${department._id}`);
                        }}
                        className="flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        <ClipboardList className="w-5 h-5 mr-2" />
                        Department Tasks
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/department-users/${department._id}`);
                        }}
                        className="flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Department Users
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Departments;
