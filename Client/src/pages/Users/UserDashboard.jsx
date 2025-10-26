import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { FaTasks, FaCalendarAlt, FaCheckCircle } from "react-icons/fa";
import UserSidebar from "./UserSidebar";

const COLORS = ["#3B82F6", "#10B981"]; // Blue, Green

const UserDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const fetchUserTasks = async () => {
      try {
        const res = await axios.get("http://localhost:4041/user/task", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        const userTasks = res.data.tasks || [];
        const completed = userTasks.filter((t) => t.status === "Completed").length;
        const pending = userTasks.length - completed;

        setTasks(userTasks);
        setStats({
          totalTasks: userTasks.length,
          completedTasks: completed,
          pendingTasks: pending,
        });
      } catch (err) {
        console.error("Error fetching user tasks:", err);
        // optional: show toast / alert
      } finally {
        setLoading(false);
      }
    };

    fetchUserTasks();
  }, []);

  const pieData = [
    { name: "Completed", value: stats.completedTasks },
    { name: "Pending", value: stats.pendingTasks },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
<UserSidebar /> 
      <div className="flex-grow p-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-blue-900 mb-6 text-center"
        >
          User Dashboard
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white p-6 shadow hover:shadow-lg transition flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <FaTasks className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-semibold">Total Tasks</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalTasks}</p>
            </div>
          </div>

          <div className="bg-white p-6 shadow hover:shadow-lg transition flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <FaCheckCircle className="text-green-500 text-2xl" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-semibold">Completed</h3>
              <p className="text-2xl font-bold text-green-500">{stats.completedTasks}</p>
            </div>
          </div>

          <div className="bg-white p-6 shadow hover:shadow-lg transition flex items-center gap-4">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <FaCalendarAlt className="text-yellow-500 text-2xl" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-semibold">Pending</h3>
              <p className="text-2xl font-bold text-yellow-500">{stats.pendingTasks}</p>
            </div>
          </div>

          <div className="bg-white p-6  shadow hover:shadow-lg transition flex items-center gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <FaTasks className="text-gray-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-semibold">Overview</h3>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalTasks ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : "0%"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 shadow-md mb-8 flex flex-col lg:flex-row gap-6"
        >
          <div className="flex-1 flex items-center justify-center">
            <PieChart width={320} height={260}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Tasks</h2>

            {loading ? (
              <div className="text-center text-gray-500">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-500">No tasks assigned.</div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-gray-50 p-4 flex justify-between items-start shadow-sm hover:shadow-md transition"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      <div className="mt-2 text-xs text-gray-500 flex gap-3">
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                        <span>Created: {task.createdBy?.name || 'Admin'}</span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          task.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : task.status === "In Progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
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

export default UserDashboard;
