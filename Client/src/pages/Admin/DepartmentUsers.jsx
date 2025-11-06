import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { Users, Building, Mail, Calendar, UserCheck } from "lucide-react";

const DepartmentUsers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch specific department
        const deptResponse = await axios.get(`http://localhost:4041/admin/departments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setDepartment(deptResponse.data.department);

        // Fetch users
        const usersResponse = await axios.get('http://localhost:4041/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        // Filter users for this department
        const departmentUsers = usersResponse.data.users.filter(user => user.departments && user.departments.some(dept => dept._id === id));
        setUsers(departmentUsers || []);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load department and user data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <AdminSidebar />
      <div className="flex-grow p-8 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-blue-900 mb-8">
            {department ? `${department.name} Users` : 'Department Users'}
          </h1>

          {!department ? (
            <p className="text-center text-gray-600 mt-10 text-lg">
              Department not found.
            </p>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white shadow-lg rounded-lg p-6"
            >
              {/* Department Header */}
              <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                <Building className="w-8 h-8 mr-3 text-blue-500" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{department.name}</h2>
                  <p className="text-gray-600">{department.description || 'No description provided'}</p>
                </div>
                <div className="ml-auto flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-green-500" />
                  <span className="text-lg font-medium text-gray-700">{users.length} Users</span>
                </div>
              </div>

              {/* Users List */}
              {users.length === 0 ? (
                <p className="text-gray-500 italic">No users assigned to this department.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <motion.div
                      key={user._id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate(`/admin/users/${user._id}`)}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center mb-3">
                        <Users className="w-6 h-6 mr-2 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <UserCheck className="w-4 h-4 mr-2" />
                          <span className="capitalize">{user.role}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DepartmentUsers;
