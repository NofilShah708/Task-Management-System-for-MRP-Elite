import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import AdminSidebar from "./AdminSidebar"; // Importing Sidebar
import { FaPlus, FaTrash, FaUser, FaCalendarAlt, FaBuilding, FaTasks } from "react-icons/fa";

const CreateTask = () => {
  const today = new Date().toISOString().split('T')[0];

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    status: "Pending",
    dueDate: "",
    department: "",
    assignedTo: [], // Array of user IDs
    createdBy: "", // Admin ID
    comments: [], // Initialize comments array
    subTasks: [] // Array of sub-tasks
  });

  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch departments and users
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get("http://localhost:4041/admin/departments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        setDepartments(res.data?.departments || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch users based on selected department
  useEffect(() => {
    const fetchUsers = async () => {
      if (!taskData.department) {
        setUsers([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const url = `http://localhost:4041/admin/users?department=${taskData.department}`;
        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        setUsers(res.data?.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [taskData.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'assignedTo') {
      const selectedUsers = Array.from(e.target.selectedOptions, option => option.value);
      setTaskData({ ...taskData, [name]: selectedUsers });
    } else {
      setTaskData({ ...taskData, [name]: value });
    }
  };

  const handleUserCheckboxChange = (userId) => {
    setTaskData((prevData) => {
      const assignedTo = prevData.assignedTo.includes(userId)
        ? prevData.assignedTo.filter(id => id !== userId)
        : [...prevData.assignedTo, userId];
      return { ...prevData, assignedTo };
    });
  };

  const addSubTask = () => {
    setTaskData((prevData) => ({
      ...prevData,
      subTasks: [...prevData.subTasks, { title: "", assignedTo: "" }]
    }));
  };

  const removeSubTask = (index) => {
    setTaskData((prevData) => ({
      ...prevData,
      subTasks: prevData.subTasks.filter((_, i) => i !== index)
    }));
  };

  const handleSubTaskChange = (index, field, value) => {
    setTaskData((prevData) => {
      const updatedSubTasks = [...prevData.subTasks];
      updatedSubTasks[index][field] = value;
      return { ...prevData, subTasks: updatedSubTasks };
    });
  };

  const handleSubTaskUserChange = (index, userId) => {
    setTaskData((prevData) => ({
      ...prevData,
      subTasks: prevData.subTasks.map((subTask, i) =>
        i === index
          ? { ...subTask, assignedTo: userId }
          : subTask
      )
    }));
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
    if (!taskData.department) {
      alert("Please select a department");
      return;
    }
    if (!taskData.assignedTo || taskData.assignedTo.length === 0) {
      alert("Please select a user to assign the task");
      return;
    }

    // Filter subTasks to only include those with a title
    const filteredTaskData = {
      ...taskData,
      subTasks: taskData.subTasks.filter(subTask => subTask.title.trim() !== "")
    };

    // Validate that each sub-task has an assigned user
    const invalidSubTasks = filteredTaskData.subTasks.filter(subTask => !subTask.assignedTo);
    if (invalidSubTasks.length > 0) {
      alert("Please assign a user to each sub-task.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        "http://localhost:4041/admin/task/create",
        filteredTaskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        }
      );
      const taskId = res.data.task._id;

      // Create subtasks after task creation
      for (const subTask of filteredTaskData.subTasks) {
        await axios.post(`http://localhost:4041/admin/task/subtask/${taskId}`, {
          title: subTask.title,
          assignedTo: subTask.assignedTo,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        });
      }

      alert("✅ Task and subtasks created successfully!");
      console.log(res.data);
      setTaskData({
        title: "",
        description: "",
        status: "Pending",
        dueDate: "",
        department: "",
        assignedTo: [],
        createdBy: "",
        comments: [], // Reset comments
        subTasks: [] // Reset subTasks
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
          <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center flex items-center justify-center">
            <FaTasks className="mr-2" /> Create New Task
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Title */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                <FaTasks className="mr-2 text-blue-500" /> Task Title
              </label>
              <input
                type="text"
                name="title"
                value={taskData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={taskData.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              ></textarea>
            </div>

            {/* Deadline */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" /> Deadline
              </label>
              <input
                type="date"
                name="dueDate"
                value={taskData.dueDate}
                onChange={handleChange}
                min={today}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Department Select */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                <FaBuilding className="mr-2 text-blue-500" /> Department
              </label>
              <select
                name="department"
                value={taskData.department || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Select Department</option>
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No departments found</option>
                )}
              </select>
            </div>

            {/* Assign to Users (Multiple) */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                <FaUser className="mr-2 text-blue-500" /> Assign To (Multiple Users)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {users.length > 0 ? (
                  users.map((user) => (
                    <label key={user._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={taskData.assignedTo.includes(user._id)}
                        onChange={() => handleUserCheckboxChange(user._id)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="text-sm">{user.name || user.username || `User ${user._id}`}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500">No users found</p>
                )}
              </div>
            </div>

            {/* Sub-Tasks Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold mb-4 text-gray-700 flex items-center justify-between">
                <span className="flex items-center">
                  <FaTasks className="mr-2 text-blue-500" /> Sub-Tasks
                </span>
                <button
                  type="button"
                  onClick={addSubTask}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                >
                  <FaPlus className="mr-1" /> Add Sub-Task
                </button>
              </label>
              {taskData.subTasks.map((subTask, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-semibold text-gray-700">Sub-Task {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSubTask(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Sub-task title"
                      value={subTask.title}
                      onChange={(e) => handleSubTaskChange(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-1">Assign User</label>
                      <select
                        value={subTask.assignedTo}
                        onChange={(e) => handleSubTaskUserChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select User</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name || user.username || `User ${user._id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Comments
              </label>
              <textarea
                name="comment"
                value={taskData.comments.length > 0 ? taskData.comments[0].text : ""}
                onChange={handleCommentChange}
                placeholder="Add a comment..."
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg"
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