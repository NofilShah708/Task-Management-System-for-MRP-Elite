import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import AdminSidebar from "./AdminSidebar"; // Importing Sidebar

const CreateTask = () => {
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    status: "Pending",
    dueDate: "",
    assignedTo: [], // Now an array
    createdBy: "", // Admin ID
    comments: [] // Initialize comments array
  });

  const [users, setUsers] = useState([]);

  // Fetch all users for dropdown
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
        // Assuming the API returns an array of users
        setUsers(res.data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'assignedTo') {
      // For multi-select, we need to handle array
      const selectedUsers = Array.from(e.target.selectedOptions, option => option.value);
      setTaskData({ ...taskData, [name]: selectedUsers });
    } else {
      setTaskData({ ...taskData, [name]: value });
    }
  };

  const handleCommentChange = (e) => {
    const { value } = e.target;
    setTaskData((prevData) => ({
      ...prevData,
      comments: value ? [{ text: value, createdAt: new Date() }] : [] // Add comment with current date only if value exists

    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!taskData.title.trim()) {
      alert("Task title is required");
      return;
    }
    if (!taskData.assignedTo || taskData.assignedTo.length === 0) {
      alert("Please select at least one user to assign the task");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        "http://localhost:4041/admin/task/create",
        taskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        }
      );
      alert("✅ Task created successfully!");
      console.log(res.data);
      setTaskData({
        title: "",
        description: "",
        status: "Pending",
        dueDate: "",
        assignedTo: [],
        createdBy: "",
        comments: [] // Reset comments
      });
    } catch (error) {
      console.error("Error creating task:", error);
      alert("❌ Failed to create task");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-grow p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-lg p-8 max-w-2xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
            Create New Task
          </h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Task Title
              </label>
              <input
                type="text"
                name="title"
                value={taskData.title}
                onChange={handleChange}
                style={{
                  border: '0.75px solid gray'
                }}
                placeholder="Enter task title"
                className="w-full px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={taskData.description}
                onChange={handleChange}
                placeholder="Enter task description"
                style={{
                  border: '0.75px solid gray'
                }}
                rows="4"
                className="w-full px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Deadline
              </label>
              <input
                type="date"
                name="dueDate"
                value={taskData.dueDate}
                onChange={handleChange}
                style={{
                  border: '0.75px solid gray'
                }}
                className="w-full px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Assign to User Multi-Select */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Assign To (Select multiple users)
              </label>
              <select
                name="assignedTo"
                multiple
                value={taskData.assignedTo}
                onChange={handleChange}
                style={{
                  border: '0.75px solid gray',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}
                className="w-full px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                {users.length > 0 ? (
                  users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.username || `User ${user._id}`}
                    </option>
                  ))
                ) : (
                  <option disabled>No users found</option>
                )}
              </select>
            </div>

            {/* Comments Section */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Comments
              </label>
              <textarea
                name="comment"
                value={taskData.comments.length > 0 ? taskData.comments[0].text : ""}
                onChange={handleCommentChange}
                placeholder="Add a comment..."
                style={{
                  border: '0.75px solid gray'
                }}
                rows="2"
                className="w-full px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 bg-blue-900 hover:bg-blue-900 text-white font-semibold transition-all"
            >
              Create Task
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateTask;