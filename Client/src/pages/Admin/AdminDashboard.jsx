import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    const fetchData = async () => {
      try {
        const [taskRes, userRes] = await Promise.all([
          axios.get("http://localhost:4041/admin/task/read", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
          axios.get("http://localhost:4041/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
        ]);

        const allTasks = taskRes.data.tasks || [];

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
      <div className="flex-grow p-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-blue-900 mb-6 text-center"
        >
          Admin Dashboard
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white p-6 shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm font-semibold">Total Tasks</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalTasks}</p>
          </div>

          <div className="bg-white p-6 shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm font-semibold">Completed Tasks</h3>
            <p className="text-3xl font-bold text-green-500">{stats.completedTasks}</p>
          </div>

          <div className="bg-white p-6 shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm font-semibold">Pending Tasks</h3>
            <p className="text-3xl font-bold text-yellow-500">{stats.pendingTasks}</p>
          </div>

          <div className="bg-white p-6 shadow hover:shadow-lg transition">
            <h3 className="text-gray-500 text-sm font-semibold">Total Users</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="bg-white p-8 shadow-md mb-8 flex justify-center"
        >
          {totalPie === 0 ? (
            <div className="text-gray-500">No task data to display</div>
          ) : (
            <PieChart width={400} height={300}>
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
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;