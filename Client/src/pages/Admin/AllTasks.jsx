import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Loader2, Users, MessageCircle, Download, Send, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

const AllTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "All", department: "All", username: "All" });
  const [searchQuery, setSearchQuery] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [seenTasks, setSeenTasks] = useState(new Set(JSON.parse(localStorage.getItem("seenTasks") || "[]")));
  const [departments, setDepartments] = useState([]);
  const [usernames, setUsernames] = useState([]);

  // Function to get user name from assignment (handles old and new formats)
  const getUserName = (assignment) => {
    if (assignment.user && typeof assignment.user === 'object' && assignment.user.name) {
      return assignment.user.name;
    }
    if (typeof assignment === 'object' && assignment.name) {
      return assignment.name;
    }
    return "N/A";
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:4041/admin/task/read", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setTasks(res.data.tasks || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    setDepartments([...new Set(tasks.map(task => task.department?.name).filter(Boolean))]);
  }, [tasks]);

  useEffect(() => {
    let filteredTasksForUsernames = tasks;
    if (filter.department !== "All") {
      filteredTasksForUsernames = tasks.filter(task => task.department?.name === filter.department);
    }
    setUsernames([...new Set(filteredTasksForUsernames.flatMap(task => Array.isArray(task.assignedTo) ? task.assignedTo.map(getUserName) : []).filter(Boolean))]);
  }, [tasks, filter.department]);

  const filteredTasks = tasks
    .filter((task) => filter.status === "All" || task.status === filter.status)
    .filter((task) => filter.department === "All" || task.department?.name === filter.department)
    .filter((task) => {
      if (filter.username === "All") return true;
      const assignedUsernames = Array.isArray(task.assignedTo) ? task.assignedTo.map(getUserName) : [];
      return assignedUsernames.includes(filter.username);
    })
    .filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "In Progress":
        return "bg-yellow-100 text-yellow-700";
      case "Pending":
      default:
        return "bg-red-100 text-red-700";
    }
  };

  // Function to export tasks to Excel
  const exportToExcel = (tasksToExport, filename) => {
    const worksheetData = tasksToExport.map(task => ({
      Title: task.title,
      Description: task.description,
      Status: task.status,
      DueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB") : "N/A",
      Department: task.department?.name || "N/A",
      AssignedTo: Array.isArray(task.assignedTo) ? task.assignedTo.map(getUserName).join(", ") : "N/A",
      Subtasks: task.subtasks ? task.subtasks.map(s => `${s.title} (Assigned to: ${s.assignedTo?.name || "Unknown"}, Status: ${s.status})`).join("; ") : "No subtasks",
      Comments: task.comments ? task.comments.map(c => `${c.text} (by ${c.createdBy?.name || "Unknown"} on ${new Date(c.createdAt).toLocaleDateString()})`).join("; ") : "No comments"
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, filename);
  };

  // Export all tasks
  const handleExportAll = () => {
    exportToExcel(tasks, "All_Tasks_Report.xlsx");
  };

  // Export individual task
  const handleExportTask = (task) => {
    exportToExcel([task], `${task.title.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`);
  };

  // Handle comment submission
  const handleCommentSubmit = async (taskId) => {
    const commentText = commentInputs[taskId]?.trim();
    if (!commentText) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:4041/admin/task/comment/${taskId}`, {
        text: commentText,
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Clear the input
      setCommentInputs(prev => ({ ...prev, [taskId]: "" }));

      // Refetch tasks to update comments
      const res = await axios.get("http://localhost:4041/admin/task/read", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:4041/admin/task/delete/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Refetch tasks to update the list
      const res = await axios.get("http://localhost:4041/admin/task/read", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Function to mark task as seen
  const markTaskAsSeen = (taskId) => {
    const newSeenTasks = new Set(seenTasks);
    newSeenTasks.add(taskId);
    setSeenTasks(newSeenTasks);
    localStorage.setItem("seenTasks", JSON.stringify([...newSeenTasks]));
  };


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <AdminSidebar />

      <div className="flex-grow p-4 md:p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-blue-900">
            All Tasks Overview
          </h1>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0">
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="px-4 py-2 border border-gray-300 bg-white shadow-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all w-full sm:w-auto"
            />

            {/* Download Excel Button */}
            <button
              onClick={handleExportAll}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Tasks Report
            </button>

            {/* Filter Dropdowns */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              {/* Status Filter */}
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 bg-white shadow-sm text-gray-700 font-semibold hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all w-full sm:w-auto"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Department Filter */}
              <select
                value={filter.department}
                onChange={(e) => setFilter(prev => ({ ...prev, department: e.target.value, username: "All" }))}
                className="px-4 py-2 border border-gray-300 bg-white shadow-sm text-gray-700 font-semibold hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all w-full sm:w-auto"
              >
                <option value="All">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Username Filter */}
              <select
                value={filter.username}
                onChange={(e) => setFilter(prev => ({ ...prev, username: e.target.value }))}
                className="px-4 py-2 border border-gray-300 bg-white shadow-sm text-gray-700 font-semibold hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all w-full sm:w-auto"
              >
                <option value="All">All Users</option>
                {usernames.map(username => (
                  <option key={username} value={username}>{username}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            <span className="ml-3 text-gray-700 text-lg font-medium">
              Loading tasks...
            </span>
          </div>
        ) : (
          <>
            {filteredTasks.length === 0 ? (
              <p className="text-center text-gray-600 mt-10 text-lg">
                No tasks found for this filter.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task._id || index}
                    whileHover={{ scale: 1.03 }}
                    className="relative bg-white/80 backdrop-blur-xl shadow-md p-4 md:p-5 border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      markTaskAsSeen(task._id);
                      navigate(`/admin/task/${task._id}`);
                    }}
                  >
                    {/* New Comments Indicator */}
                    {task.comments && task.comments.length > 0 && !seenTasks.has(task._id) && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}

                    {/* Task Title */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {task.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {task.description}
                    </p>

                    {/* Task Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    {/* Assigned User */}
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <Users className="w-4 h-4 mr-2 text-purple-500" />
                      <span>
                        Assigned To:{" "}
                        <span className="font-medium text-gray-800">
                          {Array.isArray(task.assignedTo) ? task.assignedTo.map(getUserName).join(", ") : "N/A"}
                        </span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllTasks;
