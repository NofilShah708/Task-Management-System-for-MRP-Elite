import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Loader2, Users, MessageCircle, Download, Send, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

const AllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [commentInputs, setCommentInputs] = useState({});

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

  const filteredTasks = tasks
    .filter((task) => filter === "All" ? true : task.status === filter)
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

  // Function to export tasks to Excel
  const exportToExcel = (tasksToExport, filename) => {
    const worksheetData = tasksToExport.map(task => ({
      Title: task.title,
      Description: task.description,
      Status: task.status,
      DueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB") : "N/A",
      AssignedTo: Array.isArray(task.assignedTo) ? task.assignedTo.map(getUserName).join(", ") : "N/A",
      Comments: task.comments ? task.comments.map(c => `${c.text} (by ${c.createdBy?.name || "Unknown"} on ${new Date(c.createdAt).toLocaleDateString()})`).join("; ") : "No comments"
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, filename);
  };

  // Export all Completed and Pending tasks
  const handleExportAll = () => {
    const exportableTasks = tasks.filter(task => task.status === "Completed" || task.status === "Pending");
    exportToExcel(exportableTasks, "All_Completed_Pending_Tasks.xlsx");
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


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <AdminSidebar />

      <div className="flex-grow p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-blue-900">
            All Tasks Overview
          </h1>

          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="px-4 py-2 border border-gray-300 bg-white shadow-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />

            {/* Download Excel Button */}
            <button
              onClick={handleExportAll}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md"
            >
              <Download className="w-4 h-4 mr-2" />
              Tasks Report
            </button>

            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 bg-white shadow-sm text-gray-700 font-semibold hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task._id || index}
                    whileHover={{ scale: 1.03 }}
                    className="relative bg-white/80 backdrop-blur-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Task Title */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {task.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {task.description}  
                    </p>

                    {/* Due Date */}
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <Clock className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        Due:{" "}
                        {new Date(task.dueDate).toLocaleDateString("en-GB")}
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

                    {/* Individual User Statuses */}
                    {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Completion Status:</h4>
                        <div className="flex flex-wrap gap-1">
                          {task.assignedTo.map((assignment, index) => (
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
                              {getUserName(assignment)}: {assignment.status}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status === "Completed" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {task.status}
                    </div>

                    {/* Download Sheet and Delete Buttons */}
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleExportTask(task)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Sheet
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    </div>

                    {/* Comments Section */}
                    {task.comments && task.comments.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <MessageCircle className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">Comments ({task.comments.length})</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {task.comments.map((comment, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded-md text-xs">
                              <p className="text-gray-800">{comment.text}</p>
                              <div className="flex justify-between items-center mt-1 text-gray-500">
                                <span>By: {comment.createdBy?.name || "Unknown"}</span>
                                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Comment Section */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center text-gray-600 text-sm mb-2">
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span className="font-medium">Add Comment</span>
                      </div>
                      <div className="flex space-x-2">
                        <textarea
                          value={commentInputs[task._id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [task._id]: e.target.value }))}
                          placeholder="Enter your comment..."
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                          rows="2"
                        />
                        <button
                          onClick={() => handleCommentSubmit(task._id)}
                          className="flex items-center px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 shadow-md text-xs"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Send
                        </button>
                      </div>
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
