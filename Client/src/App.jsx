import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Login from './pages/Auth/Auth';
import AdminDashboard from './pages/Admin/AdminDashboard'
import TaskCreate from './pages/Admin/CreatTask';
import TaskUpdate from './pages/Admin/UpdateTask';
import AllTaskByAdmin from './pages/Admin/AllTasks';
import UserDashboard from './pages/Users/UserDashboard';
import TaskListByUser from './pages/Users/ReadTask';
import UserProfile from './pages/Users/UserProfile';
import Navbar from './components/Navbar';
import AllUsers from './pages/Admin/UsersList'
import CreateUser from './pages/Admin/CreateUser';
import CreateAdmin from './pages/Admin/CreateAdmin';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return null;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"  element={<Login />} />
        <Route path="/admin.192.168" element={<CreateAdmin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AllUsers /></ProtectedRoute>} />
        <Route path="/admin/users/create" element={<ProtectedRoute><CreateUser /></ProtectedRoute>} />
        <Route path="/admin/task/create" element={<ProtectedRoute><TaskCreate /></ProtectedRoute>} />
        <Route path="/admin/task/update/:id" element={<ProtectedRoute><TaskUpdate /></ProtectedRoute>} />
        <Route path="/admin/task/read" element={<ProtectedRoute><AllTaskByAdmin /></ProtectedRoute>} />
        <Route path="/user" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/task" element={<ProtectedRoute><TaskListByUser /></ProtectedRoute>} />
        <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;