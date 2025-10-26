import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from './AdminSidebar'; // Importing the AdminSidebar

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get("http://localhost:4041/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        setUsers(res.data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4041/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      // Remove the deleted user from the state
      setUsers(users.filter(user => user._id !== userId));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-grow p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">Users List</h1>
        {loading ? (
          <div className="text-center">Loading users...</div>
        ) : (
          <div className="max-h-120 overflow-y-auto border border-gray-300 p-4">
            <ul className="space-y-4">
              {users.map(user => (
                <li key={user._id} className="bg-white shadow-md p-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
                    <p className="text-gray-600">Email: {user.email}</p>
                    <p className="text-gray-600">Username: {user.name}</p>
                    <p className="text-gray-600">Role: {user.role}</p>
                    
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="ml-4 bg-red-600 text-white px-3 py-1 hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;