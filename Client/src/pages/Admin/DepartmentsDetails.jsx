import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Loader2, Users, MessageCircle, Download, Send, Trash2, Building } from "lucide-react";
import * as XLSX from "xlsx";

const DepartmentsDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartmentDetails = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch department details
        const deptResponse = await axios.get(`http://localhost:4041/admin/departments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setDepartment(deptResponse.data.department);

        // Fetch users in this department
        const usersResponse = await axios.get('http://localhost:4041/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        const deptUsers = usersResponse.data.users.filter(user => user.departments && user.departments.some(dept => dept._id === id));
        setUsers(deptUsers);

        // Fetch tasks for users in this department
        const taskPromises = deptUsers.map(user =>
          axios.get(`http://localhost:4041/admin/users/${user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          })
        );
        const taskResponses = await Promise.all(taskPromises);
        const allTasks = taskResponses.flatMap(response => response.data.tasks || []);
        setTasks(allTasks);

      } catch (err) {
        console.error('Error fetching department details:', err);
        setError('Failed to load department details');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentDetails();
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

  // Calculate department statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'Pending').length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <AdminSidebar />
      <div className="flex-grow p-8 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-blue-900 mb-8">
            {department?.name} Department Details
          </h1>

          {/* Department Info Section */}
          <div className="bg-white shadow-lg p-6 mb-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <Building className="w-6 h-6 mr-2 text-blue-500" />
              Department Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                <p className="mt-1 text-lg text-gray-900">{department?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-lg text-gray-900">{department?.description || 'No description provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-lg text-gray-900">{new Date(department?.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Employees</label>
                <p className="mt-1 text-lg text-gray-900">{users.length}</p>
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
                <Users className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white shadow-lg p-6 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-gray-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
                  <p className="text-sm text-gray-600">Pending Tasks</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tasks Assigned to Department</h2>
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks assigned to users in this department.</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/admin/task/${task._id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                      <span>Created by: {task.createdBy?.name || 'Unknown'}</span>
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

export default DepartmentsDetails;
