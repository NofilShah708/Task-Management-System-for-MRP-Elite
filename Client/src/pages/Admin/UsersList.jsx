import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Loader2, Users, MessageCircle, Download, Send, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch users
        const usersResponse = await axios.get('http://localhost:4041/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        // Fetch departments for department names
        const departmentsResponse = await axios.get('http://localhost:4041/admin/departments', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        setDepartments(departmentsResponse.data.departments || []);

        // For each user, fetch their latest 3 tasks
        const usersWithTasks = await Promise.all(
          usersResponse.data.users.map(async (user) => {
            try {
              const tasksResponse = await axios.get(`http://localhost:4041/admin/users/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
              });
              const tasks = tasksResponse.data.tasks || [];
              // Get latest 3 tasks
              const latestTasks = tasks.slice(0, 3);
              return { ...user, latestTasks };
            } catch (taskErr) {
              console.error(`Error fetching tasks for user ${user._id}:`, taskErr);
              return { ...user, latestTasks: [] };
            }
          })
        );

        setUsers(usersWithTasks);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users
    .filter((user) => filter === "All" ? true : user.role === filter)
    .filter((user) =>
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d._id === deptId);
    return dept ? dept.name : 'Not specified';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <AdminSidebar />

      <div className="flex-grow p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-blue-900">
            All Users Overview
          </h1>

          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="px-4 py-2 border border-gray-300 bg-white shadow-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />

            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 bg-white shadow-sm text-gray-700 font-semibold hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <option value="All">All</option>
              <option value="admin">Admin</option>
              <option value="user">Employee</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            <span className="ml-3 text-gray-700 text-lg font-medium">
              Loading users...
            </span>
          </div>
        ) : (
          <>
            {filteredUsers.length === 0 ? (
              <p className="text-center text-gray-600 mt-10 text-lg">
                No users found for this filter.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user._id || index}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => navigate(`/admin/users/${user._id}`)}
                    className="relative bg-white/80 backdrop-blur-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    {/* User Name */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {user.name}
                    </h2>

                    {/* User ID */}
                    <p className="text-gray-600 text-sm mb-3">
                      {user.userid}
                    </p>

                    {/* Role */}
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <Users className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        Role: {user.role}
                      </span>
                    </div>

                    {/* Department */}
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <span>
                        Department: {Array.isArray(user.departments) ? (user.departments.length > 0 ? user.departments.map(dept => dept.name).join(', ') : 'Not specified') : (user.departments?.name || 'Not specified')}
                      </span>
                    </div>

                    {/* Latest Tasks */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Latest Tasks:</h4>
                      {user.latestTasks && user.latestTasks.length > 0 ? (
                        <div className="space-y-1">
                          {user.latestTasks.map((task, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                              <p className="font-medium text-gray-800">{task.title}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                                  task.status === 'Completed'
                                    ? 'bg-green-100 text-green-800'
                                    : task.status === 'In Progress'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {task.status}
                                </span>
                                <span className="text-gray-500">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB") : "N/A"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No tasks assigned</p>
                      )}
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

export default UserList;
