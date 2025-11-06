import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { FaPaperclip, FaTimes, FaDownload } from 'react-icons/fa';
import {
  CheckCircle,
  Clock,
  Loader2,
  Users,
  Send,
  Trash2,
  Bell,
  AlertCircle,
  Plus,
  Edit,
  Save,
  X,
  Download
} from "lucide-react";

const COLORS = {
  Completed: '#10B981',
  'In Progress': '#F59E0B',
  Pending: '#EF4444',
  'Pending Approval': '#8B5CF6'
};

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [approving, setApproving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [showCreateSubtaskModal, setShowCreateSubtaskModal] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newSubtaskAssignedTo, setNewSubtaskAssignedTo] = useState('');
  const [newSubtaskDepartment, setNewSubtaskDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedDueDate, setEditedDueDate] = useState('');
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch task details
        const taskResponse = await axios.get(`http://localhost:4041/admin/task/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setTask(taskResponse.data.task);
        setComments(taskResponse.data.comments || []);
        setSubtasks(taskResponse.data.task.subtasks || []);

        // Fetch all users for assignment
        const usersResponse = await axios.get('http://localhost:4041/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setUsers(usersResponse.data.users || []);

        // Fetch departments
        const departmentsResponse = await axios.get('http://localhost:4041/admin/departments', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setDepartments(departmentsResponse.data.departments || []);

      } catch (err) {
        console.error('Error fetching task details:', err);
        setError('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTaskDetails();
    }
  }, [id]);

  useEffect(() => {
    if (newSubtaskDepartment) {
      const filtered = users.filter(user => user.departments && user.departments.some(dept => dept._id === newSubtaskDepartment));
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [newSubtaskDepartment, users]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const commentText = newComment.trim();
    const finalText = commentText || (attachments.length > 0 ? '[Attachment]' : '');
    if (!finalText) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('text', finalText);

      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await axios.post(
        `http://localhost:4041/admin/task/comment/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      setTask(response.data.task);
      setComments(response.data.task.comments || []);
      setNewComment('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showNotificationMessage('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      showNotificationMessage('Failed to add comment');
    }
  };

  const handleApproveTask = async () => {
    if (task.status !== 'Pending Approval') {
      showNotificationMessage('Task is not pending approval');
      return;
    }

    setApproving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4041/admin/task/approve/${id}`, { status: 'Completed' }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Refetch task details
      const response = await axios.get(`http://localhost:4041/admin/task/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTask(response.data.task);
      showNotificationMessage('Task approved and completed successfully');
    } catch (error) {
      console.error('Error approving task:', error);
      showNotificationMessage('Failed to approve task');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectTask = async () => {
    if (task.status !== 'Pending Approval') {
      showNotificationMessage('Task is not pending approval');
      return;
    }

    setApproving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4041/admin/task/approve/${id}`, { status: 'Pending' }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Refetch task details
      const response = await axios.get(`http://localhost:4041/admin/task/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTask(response.data.task);
      showNotificationMessage('Task rejected and set to pending');
    } catch (error) {
      console.error('Error rejecting task:', error);
      showNotificationMessage('Failed to reject task');
    } finally {
      setApproving(false);
    }
  };



  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4041/admin/task/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      showNotificationMessage('Task deleted successfully');
      navigate('/admin/task/read');
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotificationMessage('Failed to delete task');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setCreatingSubtask(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:4041/admin/task/subtask/${id}`, {
        title: newSubtaskTitle,
        description: newSubtaskDescription,
        dueDate: newSubtaskDueDate,
        assignedTo: newSubtaskAssignedTo,
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setNewSubtaskTitle('');
      setNewSubtaskDescription('');
      setNewSubtaskDueDate('');
      setNewSubtaskAssignedTo('');
      setShowCreateSubtaskModal(false);

      // Refetch task details to update subtasks
      const response = await axios.get(`http://localhost:4041/admin/task/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTask(response.data.task);
      setSubtasks(response.data.task.subtasks || []);
      showNotificationMessage('Subtask created successfully');
    } catch (error) {
      console.error('Error creating subtask:', error);
      showNotificationMessage('Failed to create subtask');
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleEditTask = () => {
    setIsEditing(true);
    setEditedTitle(task.title);
    setEditedDescription(task.description);
    setEditedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4041/admin/task/update/${id}`, {
        title: editedTitle,
        description: editedDescription,
        dueDate: editedDueDate,
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Refetch task details
      const response = await axios.get(`http://localhost:4041/admin/task/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTask(response.data.task);
      setIsEditing(false);
      showNotificationMessage('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      showNotificationMessage('Failed to update task');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedDescription('');
    setEditedDueDate('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 100 * 1024 * 1024; // 100MB
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`The following files exceed 100MB and were not added: ${invalidFiles.join(', ')}`);
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadAttachment = async (commentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4041/admin/task/comment/attachment/${commentId}/${fileName}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important for file downloads
        withCredentials: true,
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      showNotificationMessage('Failed to download attachment');
    }
  };

  const handleDownloadReport = () => {
    const workbook = XLSX.utils.book_new();

    // Task Details Sheet
    const taskDetails = [
      ['Field', 'Value'],
      ['Title', task.title],
      ['Description', task.description],
      ['Status', task.status],
      ['Due Date', task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'],
      ['Created By', task.createdBy?.name || 'Unknown'],
      ['Generated On', new Date().toLocaleString()]
    ];
    const taskSheet = XLSX.utils.aoa_to_sheet(taskDetails);
    XLSX.utils.book_append_sheet(workbook, taskSheet, 'Task Details');

    // Subtasks Sheet
    const subtasksData = subtasks && subtasks.length > 0 ? subtasks.map(subtask => [
      subtask.title,
      subtask.description || '',
      subtask.status,
      getUserName(subtask.assignedTo),
      subtask.dueDate ? new Date(subtask.dueDate).toLocaleDateString() : 'No due date'
    ]) : [['No subtasks available']];
    const subtasksSheet = XLSX.utils.aoa_to_sheet([['Title', 'Description', 'Status', 'Assigned To', 'Due Date'], ...subtasksData]);
    XLSX.utils.book_append_sheet(workbook, subtasksSheet, 'Subtasks');

    // Comments Sheet
    const commentsData = comments.length > 0 ? comments.map(comment => [
      comment.createdBy?.name || 'Unknown',
      comment.text,
      new Date(comment.createdAt).toLocaleString()
    ]) : [['No comments available']];
    const commentsSheet = XLSX.utils.aoa_to_sheet([['Author', 'Text', 'Created At'], ...commentsData]);
    XLSX.utils.book_append_sheet(workbook, commentsSheet, 'Comments');

    // Assigned Users Sheet
    const assignedUsersData = task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo.map(assignment => [
      assignment.user?.name || 'Unknown User',
      assignment.status
    ]) : [['No users assigned']];
    const assignedUsersSheet = XLSX.utils.aoa_to_sheet([['Name', 'Status'], ...assignedUsersData]);
    XLSX.utils.book_append_sheet(workbook, assignedUsersSheet, 'Assigned Users');

    // Download the Excel file
    XLSX.writeFile(workbook, `task-report-${task.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  };



  const showNotificationMessage = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const getUserName = (assignedTo) => {
    if (typeof assignedTo === 'string') {
      const user = users.find(u => u._id === assignedTo);
      return user ? user.name : 'Unknown User';
    } else if (assignedTo && assignedTo.name) {
      return assignedTo.name;
    } else {
      return 'Unknown User';
    }
  };

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

  // Prepare chart data
  const getChartData = () => {
    if (!task || !subtasks.length) return [];

    const statusCounts = subtasks.reduce((acc, subtask) => {
      acc[subtask.status] = (acc[subtask.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      fill: COLORS[status] || '#8884d8'
    }));
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <div className="flex-grow flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-600">Task not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <AdminSidebar />
      <div className="flex-grow p-8 overflow-auto">
        {/* Notification */}
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            <Bell className="w-4 h-4 inline mr-2" />
            {notificationMessage}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-blue-900 mb-8">
            Task Details
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Task Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Information */}
              <div className="bg-white shadow-lg p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">{task.title}</h2>
                  {!isEditing && (
                    <button
                      onClick={handleEditTask}
                      className="flex items-center justify-center w-16 h-16 bg-gray-300 text-black rounded-full hover:bg-gray-300 transition-colors shadow-md hover:shadow-lg"
                      title="Edit Task"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        rows="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        value={editedDueDate}
                        onChange={(e) => setEditedDueDate(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-gray-900">{task.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <p className="mt-1 text-gray-900">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created By</label>
                      <p className="mt-1 text-gray-900">{task.createdBy?.name || 'Unknown'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Assigned Users */}
              <div className="bg-white shadow-lg p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Assigned Users</h2>
                {task.assignedTo && task.assignedTo.length > 0 ? (
                  <div className="space-y-3">
                    {task.assignedTo.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 mr-3 text-blue-500" />
                          <span className="font-medium">{assignment.user?.name || 'Unknown User'}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No users assigned</p>
                )}
              </div>

              {/* Subtasks */}
              <div className="bg-white shadow-lg p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Subtasks</h2>
                {subtasks && subtasks.length > 0 ? (
                  <div className="space-y-3">
                    {subtasks.map((subtask, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-medium text-gray-900 ${subtask.status === 'Completed' ? 'line-through' : ''}`}>{subtask.title}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subtask.status)}`}>
                            {subtask.status}
                          </span>
                        </div>
                        {subtask.description && (
                          <p className="text-gray-700 mb-2">{subtask.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Assigned to: {getUserName(subtask.assignedTo)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No subtasks available</p>
                )}
              </div>

              {/* Task Progress Chart */}
              <div className="bg-white shadow-lg p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Task Progress Overview</h2>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No subtasks available for chart</p>
                )}
              </div>

            </div>

            {/* Comments/Messaging Section */}
            <div className="space-y-6">
              <div className="bg-white shadow-lg p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Comments & Messages</h2>

                {/* Comments List */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment._id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {comment.createdBy?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {comment.createdBy?.name || 'Unknown User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 mt-1">{comment.text}</p>
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500 font-medium">Attachments:</p>
                                {comment.attachments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-1 bg-gray-100 rounded">
                                    <div className="flex items-center">
                                      <FaPaperclip className="w-3 h-3 mr-2 text-gray-500" />
                                      <span className="text-xs text-gray-700">{file.originalname}</span>
                                      <span className="text-xs text-gray-500 ml-1">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadAttachment(comment._id, file.originalname)}
                                      className="text-blue-500 hover:text-blue-700 ml-2"
                                      title="Download"
                                    >
                                      <FaDownload className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No comments yet</p>
                  )}
                </div>

                {/* Attachments */}
                <div className="mb-4">
                  <div className="space-y-4">
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                    />
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <FaPaperclip className="w-4 h-4 mr-2" />
                      Add Attachments
                    </button>
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <FaPaperclip className="w-4 h-4 mr-2 text-gray-500" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleCommentSubmit} className="flex space-x-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    rows="3"
                  />
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors self-end"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send
                  </button>
                </form>
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow-lg p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {task.status === 'Pending Approval' && (
                    <>
                      <button
                        onClick={handleApproveTask}
                        disabled={approving}
                        className="w-full flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {approving ? 'Approving...' : 'Approve Task'}
                      </button>
                      <button
                        onClick={handleRejectTask}
                        disabled={approving}
                        className="w-full flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mr-2" />
                        )}
                        {approving ? 'Rejecting...' : 'Reject Task'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => showNotificationMessage('Notification sent to all assigned users')}
                    className="w-full flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Send Notification
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                  </button>
                  <button
                    onClick={() => setShowCreateSubtaskModal(true)}
                    className="w-full flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Subtask
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className="w-full flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </button>
                  <button
                    onClick={() => navigate('/admin/task/read')}
                    className="w-full flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Back to Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task? This action cannot be undone and will permanently remove the task and all its subtasks.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2 inline" />
                )}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Subtask Modal */}
      {showCreateSubtaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="flex items-center mb-4">
              <Plus className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Create Subtask</h3>
            </div>
            <form onSubmit={handleCreateSubtask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newSubtaskDescription}
                  onChange={(e) => setNewSubtaskDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={newSubtaskDueDate}
                  onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={newSubtaskDepartment}
                  onChange={(e) => setNewSubtaskDepartment(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                  value={newSubtaskAssignedTo}
                  onChange={(e) => setNewSubtaskAssignedTo(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select User</option>
                  {filteredUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSubtaskModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSubtask}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSubtask ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2 inline" />
                  )}
                  {creatingSubtask ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
