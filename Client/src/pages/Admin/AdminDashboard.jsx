import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { Bell, X } from "lucide-react";

const COLORS = {
  Pending: "#3B82F6", // Blue
  Completed: "#10B981", // Green
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalUsers: 0,
  });

  const [users, setUsers] = useState([]);
  const [adminProfile, setAdminProfile] = useState({ name: '', email: '' });
  const [pendingApprovalTasks, setPendingApprovalTasks] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }


    const fetchData = async () => {
      try {
        const [taskRes, userRes, profileRes] = await Promise.all([
          axios.get("http://localhost:4041/admin/task/read", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
          axios.get("http://localhost:4041/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
          axios.get("http://localhost:4041/admin/profile", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
        ]);

        const allTasks = taskRes.data.tasks || [];

        // Filter tasks pending approval
        const pendingApproval = allTasks.filter(task => task.status === 'Pending Approval');
        setPendingApprovalTasks(pendingApproval);
        setShowNotification(pendingApproval.length > 0);

        // normalize status string to a canonical token
        const normalize = (s = "") =>
          String(s)
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

        const completedSet = new Set([
          "completed",
          "complete",
          "done",
          "finished",
          "closed",
        ]);

        // Count completed robustly; treat everything else as non-completed (pending)
        let completed = 0;
        for (const t of allTasks) {
          const st = normalize(t.status || t?.status || "");
          if (completedSet.has(st)) completed++;
        }
        const pending = Math.max(0, allTasks.length - completed);

        setStats({
          totalTasks: allTasks.length,
          completedTasks: completed,
          pendingTasks: pending,
          totalUsers: (userRes.data.users || []).length,
        });

        setUsers(userRes.data.users || []);
        setAdminProfile({
          name: profileRes.data.admin?.name || '',
          userid: profileRes.data.admin?.userid || '',
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const pieData = [
    { name: "Pending", value: stats.pendingTasks },
    { name: "Completed", value: stats.completedTasks },
  ].filter(d => d.value > 0);

  // if no data, show friendly empty state instead of empty chart
  const totalPie = pieData.reduce((s, d) => s + Number(d.value || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8">

        
        {/* Floating Notification */}
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  {pendingApprovalTasks.length} task{pendingApprovalTasks.length > 1 ? 's' : ''} pending approval
                </span>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="ml-2 text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Link
              to="/admin/task/read"
              className="block mt-2 text-xs underline hover:no-underline"
            >
              View Tasks
            </Link>
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 text-center"
        >
          Admin Dashboard
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white p-4 md:p-6 shadow-md mb-8 text-center"
        >
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Welcome, {adminProfile.name || 'Admin'}!</h2>
          <p className="text-sm md:text-base text-gray-600">{adminProfile.userid || 'admin'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
        >

          <Link to="/admin/task/read">
          <div className="bg-white p-4 md:p-6 shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm font-semibold">Total Tasks</h3>
            <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.totalTasks}</p>
          </div>
        </Link>

<Link to="/admin/task/read">
          <div className="bg-white p-4 md:p-6 shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm font-semibold">Completed Tasks</h3>
            <p className="text-2xl md:text-3xl font-bold text-green-500">{stats.completedTasks}</p>
          </div>
</Link>
<Link to="/admin/task/read">
          <div className="bg-white p-4 md:p-6 shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm font-semibold">Pending Tasks</h3>
            <p className="text-2xl md:text-3xl font-bold text-yellow-500">{stats.pendingTasks}</p>
          </div>
</Link>
<Link to="/admin/users">
          <div className="bg-white p-4 md:p-6 shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm font-semibold">Total Users</h3>
            <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
          </div>
</Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="bg-white p-4 md:p-8 shadow-md mb-8 flex justify-center"
        >
          {totalPie === 0 ? (
            <div className="text-gray-500">No task data to display</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;