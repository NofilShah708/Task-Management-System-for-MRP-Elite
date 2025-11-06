import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserSidebar from './UserSidebar';
import { FaSearch, FaCheck, FaClock, FaHourglassHalf } from 'react-icons/fa';

const ReadTask = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updating, setUpdating] = useState({}); // { [taskId]: true/false }
  const [newComment, setNewComment] = useState({}); // { [taskId]: comment text }
  const [seenTasks, setSeenTasks] = useState(new Set(JSON.parse(localStorage.getItem("seenTasks") || "[]")));

  // Maps for status conversion between frontend display and backend values
  const statusMap = {
    'Pending': 'pending',
    'In Progress': 'in_progress',
    'Completed': 'completed'
  };

  const displayMap = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'blocked': 'Blocked'
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:4041/user/task', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setTasks(response.data.tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const statusOptions = ['Pending', 'In Progress', 'Completed', 'Blocked'];

  // Get the current user's assignment status
  const getUserStatus = (task) => {
    const userAssignment = task.assignedTo?.find(assignment => assignment.user?._id === localStorage.getItem('userId'));
    return userAssignment?.status || 'Pending';
  };

  // Check if task is fully completed
  const isTaskCompleted = (task) => {
    return task.assignedTo?.every(assignment => assignment.status === 'Completed');
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // optimistic UI update
    const prevTasks = [...tasks];
    setTasks((t) => t.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task)));
    setUpdating((u) => ({ ...u, [taskId]: true }));

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:4041/user/task/status/${taskId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      // success — nothing else needed (UI already updated)
    } catch (error) {
      console.error('Error updating task status:', error);
      // revert UI on failure
      setTasks(prevTasks);
      alert('Failed to update task status.');
    } finally {
      setUpdating((u) => ({ ...u, [taskId]: false }));
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status?.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return <FaCheck className="mr-2" />;
      case 'in progress':
        return <FaHourglassHalf className="mr-2" />;
      case 'blocked':
        return <FaClock className="mr-2" />; // You might want to add a different icon for blocked
      default:
        return <FaClock className="mr-2" />;
    }
  };

  const handleAddComment = async (taskId) => {
    const commentText = newComment[taskId]?.trim();
    if (!commentText) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:4041/user/task/comment/${taskId}`,
        { text: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      // Update the task in state with the new comment
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? response.data.task : task
        )
      );
      setNewComment((prev) => ({ ...prev, [taskId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserSidebar />
      <div className="flex-grow p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Tasks</h1>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative bg-white shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    const newSeenTasks = new Set(seenTasks);
                    newSeenTasks.add(task._id);
                    setSeenTasks(newSeenTasks);
                    localStorage.setItem("seenTasks", JSON.stringify([...newSeenTasks]));
                    navigate(`/user/task/${task._id}`);
                  }}
                >
                  {/* New Comments Indicator */}
                  {task.comments && task.comments.length > 0 && !seenTasks.has(task._id) && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                        <span>By: {task.createdBy?.name || 'Unknown'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        <span>{displayMap[task.status] || task.status}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.assignedTo?.length || 0} assigned
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">No tasks found matching your criteria</div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ReadTask;
