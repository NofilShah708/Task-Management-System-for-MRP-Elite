import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import UserSidebar from './UserSidebar';
import { FaArrowLeft, FaCheck, FaClock, FaHourglassHalf, FaChartLine, FaComments, FaListUl, FaPaperclip, FaTimes } from 'react-icons/fa';

const UserTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [seenTasks, setSeenTasks] = useState(new Set(JSON.parse(localStorage.getItem("seenTasks") || "[]")));
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
      navigate('/');
      return;
    }
    setAuthChecked(true);
  }, [navigate]);

  useEffect(() => {
    if (!authChecked) return;

    const fetchTask = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:4041/user/task/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setTask({ ...response.data.task, subtasks: response.data.subtasks });

        // Mark task as seen when entering details
        const newSeenTasks = new Set(seenTasks);
        newSeenTasks.add(id);
        setSeenTasks(newSeenTasks);
        localStorage.setItem("seenTasks", JSON.stringify([...newSeenTasks]));
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, authChecked, seenTasks]);

  if (!authChecked) {
    return null;
  }

  const displayMap = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'blocked': 'Blocked'
  };

  // Get the current user's assignment status
  const getUserStatus = (task) => {
    const userAssignment = task?.assignedTo?.find(assignment => assignment.user?._id === localStorage.getItem('userId'));
    return userAssignment?.status || 'Pending';
  };

  // Check if current user is assigned to the task
  const isAssignedToTask = task?.assignedTo?.some(assignment => assignment.user?._id === localStorage.getItem('userId'));

  // Check if current user is assigned to any subtask
  const isAssignedToSubtask = task?.subtasks?.some(subtask => subtask.assignedTo?._id === localStorage.getItem('userId'));

  // Check if task is fully completed
  const isTaskCompleted = (task) => {
    return task?.assignedTo?.every(assignment => assignment.status === 'Completed');
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:4041/user/task/status/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setTask(response.data.task);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
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
        `http://localhost:4041/user/task/comment/${id}`,
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
      setNewComment('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment.');
    }
  };

  const handleSubtaskStatusChange = async (subtaskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:4041/user/task/subtask/${subtaskId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setTask(response.data.task);
    } catch (error) {
      console.error('Error updating subtask status:', error);
      alert('Failed to update subtask status.');
    }
  };

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
        return <FaClock className="mr-2" />;
      default:
        return <FaClock className="mr-2" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="flex-grow p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="flex-grow p-8">
          <div className="text-center py-8 text-gray-500">Task not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserSidebar />
      <div className="flex-grow p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <button
            onClick={() => navigate('/user/task')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <FaArrowLeft className="mr-2" />
            Back to Tasks
          </button>

          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{task.title}</h1>
                <p className="text-gray-600 mb-4">{task.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                  <span>Created by: {task.createdBy?.name || 'Unknown'}</span>
                  <span>Assigned to: {task.assignedTo?.map(a => a.user?.name).join(', ') || 'Unknown'}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className={`flex items-center px-3 py-1 rounded-full ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                  <span className="mr-2">{displayMap[task.status] || task.status}</span>
                </div>

                <div className="w-48">
                  <label className="block text-xs text-gray-500 mb-1">Update Your Status</label>
                  <select
                    value={getUserStatus(task)}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Completed</option>
                  </select>
                  {updating && <div className="text-xs text-gray-500 mt-1">Updating...</div>}
                </div>
              </div>
            </div>

            {/* Dashboard Section */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                <FaChartLine className="mr-2" />
                Task Progress Dashboard
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Overall Completion</span>
                    <span>{Math.round((task.assignedTo?.filter(a => a.status === 'Completed').length / (task.assignedTo?.length || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(task.assignedTo?.filter(a => a.status === 'Completed').length / (task.assignedTo?.length || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{task.assignedTo?.filter(a => a.status === 'Pending').length}</div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-2xl font-bold text-yellow-600">{task.assignedTo?.filter(a => a.status === 'In Progress').length}</div>
                    <div className="text-xs text-gray-500">In Progress</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-2xl font-bold text-orange-600">{task.assignedTo?.filter(a => a.status === 'Pending Approval').length}</div>
                    <div className="text-xs text-gray-500">Pending Approval</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{task.assignedTo?.filter(a => a.status === 'Completed').length}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual User Statuses */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-700 mb-3">Completion Status:</h4>
              <div className="flex flex-wrap gap-2">
                {task.assignedTo?.map((assignment, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      assignment.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'Pending Approval'
                        ? 'bg-orange-100 text-orange-800'
                        : assignment.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {assignment.user?.name}: {assignment.status}
                  </span>
                ))}
              </div>
              {isTaskCompleted(task) && (
                <div className="mt-3 text-green-600 font-semibold">
                  Task Done! All users have completed their parts.
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                  <FaListUl className="mr-2" />
                  Subtasks
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    {task.subtasks.map((subtask, index) => {
                      const assignedName = subtask.assignedTo?.name || 'Unknown';
                      return (
                        <div key={index} className="bg-white p-3 rounded shadow-sm">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 flex items-center">
                              <div className="flex-1 mr-4">
                                <h5 className={`font-medium text-gray-800 ${subtask.status === 'Completed' ? 'line-through' : ''}`}>{subtask.title}</h5>
                                <p className="text-sm text-gray-500">Assigned to: {assignedName}</p>
                              </div>
                              {subtask.assignedTo?._id === localStorage.getItem('userId') && (
                                <input
                                  type="checkbox"
                                  checked={subtask.status === 'Completed'}
                                  onChange={(e) => handleSubtaskStatusChange(subtask._id, e.target.checked ? 'Completed' : 'Pending')}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                              )}
                            </div>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              subtask.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : subtask.status === 'Pending Approval'
                                ? 'bg-orange-100 text-orange-800'
                                : subtask.status === 'In Progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {getStatusIcon(subtask.status)}
                              {subtask.status}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FaComments className="mr-3 text-blue-500" />
                Comments
              </h4>

              {/* Add Comment Form */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col gap-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your comment here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <FaPaperclip className="text-gray-500" />
                        <span className="text-sm text-gray-600">Attach Files</span>
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            const maxSize = 100 * 1024 * 1024; // 100MB
                            const validFiles = [];
                            files.forEach(file => {
                              if (file.size > maxSize) {
                                alert(`File "${file.name}" is too large. Maximum size is 100MB.`);
                              } else {
                                validFiles.push(file);
                              }
                            });
                            setAttachments(validFiles);
                          }}
                          className="hidden"
                        />
                      </label>
                      {attachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-2">Selected Files:</p>
                          <div className="space-y-1">
                            {attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                <button
                                  onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                                  className="text-red-500 hover:text-red-700 ml-2"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAddComment}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {(task.comments || []).map((comment, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {(comment.createdBy?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {comment.createdBy?.name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3 leading-relaxed">{comment.text}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="border-t border-gray-100 pt-3">
                            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                              <FaPaperclip className="mr-2" />
                              Attachments ({comment.attachments.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {comment.attachments.map((attachment, attIndex) => (
                                <a
                                  key={attIndex}
                                  href={`http://localhost:4041/user/task/attachment/${attachment.filename}`}
                                  download={attachment.originalname}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                >
                                  <FaPaperclip className="text-xs" />
                                  {attachment.originalname}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(task.comments || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FaComments className="mx-auto mb-2 text-2xl text-gray-300" />
                    <p>No comments yet. Be the first to add one!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserTaskDetails;
