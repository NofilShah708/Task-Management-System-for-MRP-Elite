import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaEnvelope } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Auth = () => {
  const [isAdmin, setIsAdmin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const toggleRole = () => {
    setIsAdmin(!isAdmin);
    setFormData({ email: '', password: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isAdmin
        ? 'http://localhost:4041/auth/admin/login'
        : 'http://localhost:4041/auth/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        // prefer backend role when available, otherwise use current toggle
        const role = data.user?.role || (isAdmin ? 'admin' : 'user');
        window.location.href = role === 'admin' ? '/admin' : '/user';
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="bg-white shadow-lg  w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-blue-900">
            {isAdmin ? 'Admin Login' : 'User Login'}
          </h1>
          <button
            onClick={toggleRole}
            className="text-sm text-gray-600 hover:text-blue-900"
          >
            Switch to {isAdmin ? 'User' : 'Admin'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
            <div className="flex items-center border border-gray-300 px-3">
              <FaEnvelope className="text-gray-400 mr-2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full py-2 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
            <div className="flex items-center border border-gray-300 px-3">
              <FaLock className="text-gray-400 mr-2" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                className="w-full py-2 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2   text-white font-semibold transition ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-900'
            }`}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        
      </motion.div>
    </div>
  );
};

export default Auth;