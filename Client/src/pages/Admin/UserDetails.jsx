import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Loader2, Users, MessageCircle, Download, Send, Trash2, BarChart3, PieChart, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line } from 'recharts';

const UserDetails = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:4041/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setUser(response.data.user);
        setTasks(response.data.tasks || []);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:4041/admin/departments', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setDepartments(response.data.departments || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };

    fetchUserDetails();
    fetchDepartments();
  }, [id]);

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

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d._id === deptId);
    return dept ? dept.name : 'Not specified';
  };

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const blockedTasks = tasks.filter(task => task.status === 'Blocked').length;
  const pendingTasks = tasks.filter(task => task.status === 'Pending').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Data for charts
  const statusData = [
    { name: 'Completed', value: completedTasks, color: '#10B981' },
    { name: 'In Progress', value: inProgressTasks, color: '#F59E0B' },
    { name: 'Blocked', value: blockedTasks, color: '#EF4444' },
    { name: 'Pending', value: pendingTasks, color: '#6B7280' },
  ];

  const monthlyData = [
    { month: 'Jan', tasks: 4 },
    { month: 'Feb', tasks: 6 },
    { month: 'Mar', tasks: 8 },
    { month: 'Apr', tasks: 5 },
    { month: 'May', tasks: 9 },
    { month: 'Jun', tasks: 7 },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <AdminSidebar />
      <div className="flex-grow p-8 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-blue-900 mb-8">
            {user.name}'s Details
          </h1>

          {/* User Profile Section */}
          <div className="bg-white shadow-lg p-6 mb-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-lg text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-lg text-gray-900">{user.userid}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-lg text-gray-900">{user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="mt-1 text-lg text-gray-900">{user.departments && user.departments.length > 0 ? user.departments.map(dept => typeof dept === 'object' ? dept.name : getDepartmentName(dept)).join(', ') : 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Created</label>
                <p className="mt-1 text-lg text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Completion Rate</label>
                <p className="mt-1 text-lg text-gray-900">{completionRate}%</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white shadow-lg p-6 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
                  <p className="text-sm text-gray-600">Completed Tasks</p>
                </div>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white shadow-lg p-6 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{inProgressTasks}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white shadow-lg p-6 rounded-lg">
              <div className="flex items-center">
                <Trash2 className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{blockedTasks}</p>
                  <p className="text-sm text-gray-600">Blocked Tasks</p>
                </div>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white shadow-lg p-6 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Task Status Pie Chart */}
            <div className="bg-white shadow-lg p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Task Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Progress Bar Chart */}
            <div className="bg-white shadow-lg p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Task Completion</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Assigned Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks assigned to this user.</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task._id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : task.status === 'Blocked'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                      <span>Created by: {task.createdBy?.name || 'Unknown'}</span>
                      <span>Priority: {task.priority || 'Medium'}</span>
                    </div>

                    {/* Individual User Statuses */}
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Team Progress:</h4>
                      <div className="flex flex-wrap gap-2">
                        {task.assignedTo?.map((assignment, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : assignment.status === 'In Progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : assignment.status === 'Blocked'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {assignment.user?.name}: {assignment.status}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Comments Section */}
                    {task.comments && task.comments.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                        <div className="space-y-2">
                          {task.comments.map((comment, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <p className="text-sm text-gray-700">{comment.text}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {comment.createdBy?.name || 'Unknown'} - {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserDetails;
