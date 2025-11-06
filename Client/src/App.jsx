import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Login from './pages/Auth/Auth';
import AdminDashboard from './pages/Admin/AdminDashboard'
import TaskCreate from './pages/Admin/CreatTask';
import TaskUpdate from './pages/Admin/UpdateTask';
import AllTaskByAdmin from './pages/Admin/AllTasks';
import UserDashboard from './pages/Users/UserDashboard';
import TaskListByUser from './pages/Users/ReadTask';
import Navbar from './components/Navbar';
import AllUsers from './pages/Admin/UsersList'
import UserDetails from './pages/Admin/UserDetails';
import CreateUser from './pages/Admin/CreateUser';
import CreateAdmin from './pages/Admin/CreateAdmin';
import CreateDepartment from './pages/Admin/CreateDepartment';
import Departments from './pages/Admin/Departments';
import DepartmentsDetails from './pages/Admin/DepartmentsDetails';
import DepartmentUsers from './pages/Admin/DepartmentUsers';
import TaskDetails from './pages/Admin/TaskDetails';
import UserTaskDetails from './pages/Users/UserTaskDetails';
import AdminProfile from './pages/Admin/AdminProfile';
import UserProfile from './pages/Users/UserProfile';


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
        <Route path='/admin/profile' element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
        <Route path="/admin.192.168.0.0.0.0" element={<CreateAdmin />} />
        <Route path='/user/profile' element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AllUsers /></ProtectedRoute>} />
        <Route path="/admin/users/:id" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />
        <Route path="/admin/users/create" element={<ProtectedRoute><CreateUser /></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/admin/departments/:id" element={<ProtectedRoute><DepartmentsDetails /></ProtectedRoute>} />
        <Route path="/admin/departments/create" element={<ProtectedRoute><CreateDepartment /></ProtectedRoute>} />
        <Route path="/admin/department-users/:id" element={<ProtectedRoute><DepartmentUsers /></ProtectedRoute>} />
        <Route path="/admin/task/:id" element={<ProtectedRoute><TaskDetails /></ProtectedRoute>} />
        <Route path="/admin/task/create" element={<ProtectedRoute><TaskCreate /></ProtectedRoute>} />
        <Route path="/admin/task/update/:id" element={<ProtectedRoute><TaskUpdate /></ProtectedRoute>} />
        <Route path="/admin/task/read" element={<ProtectedRoute><AllTaskByAdmin /></ProtectedRoute>} />
        <Route path="/user" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/task" element={<ProtectedRoute><TaskListByUser /></ProtectedRoute>} />
        <Route path="/user/task/:id" element={<ProtectedRoute><UserTaskDetails /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
