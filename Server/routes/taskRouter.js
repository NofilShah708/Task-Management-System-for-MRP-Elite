// Task Management System - Task Router
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/tokenVerification');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../multer'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    cb(null, true);
  }
});

// Allowed status values for tasks
const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Completed', 'Blocked', 'Pending Approval'];

// middleware: ensure token valid and belongs to an admin
const requireAdmin = async (req, res, next) => {
  try {
    const id = (req.user && (req.user.id || req.user._id || req.user.userId)) || req.adminId;
    if (!id) return res.status(401).json({ message: 'Missing id in token' });

    const admin = await Admin.findById(id);
    if (!admin) return res.status(403).json({ message: 'Admin access required' });

    req.admin = admin;
    req.adminId = admin._id;
    return next();
  } catch (err) {
    return res.status(500).json({ message: 'Server error verifying admin', error: err.message });
  }
};

// middleware: ensure token valid and belongs to a user
const requireUser = async (req, res, next) => {
  try {
    const id = req.user && (req.user.id || req.user._id || req.user.userId);
    if (!id) return res.status(401).json({ message: 'Missing id in token' });

    const user = await User.findById(id);
    if (!user) return res.status(403).json({ message: 'User access required' });

    req.userDoc = user;
    req.userId = user._id;
    return next();
  } catch (err) {
    return res.status(500).json({ message: 'Server error verifying user', error: err.message });
  }
};

/*
 Admin endpoints (paths exactly as requested)
 - POST   /admin/task/create        -> create task
 - PUT    /admin/task/update/:id    -> update task
 - GET    /admin/task/read          -> list tasks (optional query filters)
 - DELETE /admin/task/delete/:id    -> delete task
*/

// Create task
router.post('/task/create', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority, status, comments, department } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!department) return res.status(400).json({ message: 'Department is required' });
    if (!assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) return res.status(400).json({ message: 'AssignedTo must be a non-empty array of user IDs' });
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    // Process assignedTo to include individual statuses
    const processedAssignedTo = assignedTo.map(userId => ({
      user: userId,
      status: 'Pending'
    }));

    // Process comments: set createdBy to adminId if comments are provided
    let processedComments = [];
    if (comments && Array.isArray(comments)) {
      processedComments = comments.map(comment => ({
        text: comment.text,
        createdBy: req.adminId, // Set to admin who is creating the task
        createdByModel: 'Admin',
        createdAt: comment.createdAt || new Date()
      }));
    }

    const task = new Task({
      title,
      description: description || '',
      assignedTo: processedAssignedTo,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'Pending',
      createdBy: req.adminId,
      department,
      comments: processedComments
    });

    await task.save();
    return res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    return res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

// Update task
router.patch('/task/update/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const allowed = ['title', 'description', 'assignedTo', 'dueDate', 'status'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.status && !ALLOWED_STATUSES.includes(updates.status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.status(200).json({ message: 'Task updated', task });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating task', error: err.message });
  }
});

// Read (list) tasks
router.get('/task/read', verifyToken, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.assignedTo) filter['assignedTo.user'] = req.query.assignedTo;
    if (req.query.status) filter.status = req.query.status;
    const tasks = await Task.find(filter)
      .populate('assignedTo.user', 'name')
      .populate('createdBy', 'name')
      .populate('comments.createdBy', 'name')
      .populate('department', 'name')
      .populate('subtasks.assignedTo', 'name')
      .sort({ createdAt: -1 });
    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// Delete task
router.delete('/task/delete/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting task', error: err.message });
  }
});

/*
 User endpoints
 - GET    /user/task               -> list tasks assigned to authenticated user
 - PATCH  /user/task/status/:id    -> update status of assigned task
 - POST   /user/task/comment/:id   -> add comment to task
*/

/*
 Admin endpoints (additional)
 - POST   /admin/task/comment/:id   -> add comment to task
*/

// List tasks assigned to current user
router.get('/task', verifyToken, requireUser, async (req, res) => {
  try {
    const filter = {
      $or: [
        { 'assignedTo.user': req.userId },
        { 'subtasks.assignedTo': req.userId }
      ]
    };
    if (req.query.status) filter.status = req.query.status;
    const tasks = await Task.find(filter).populate('assignedTo.user', 'name').populate('createdBy', 'name').populate('comments.createdBy', 'name').sort({ dueDate: 1, createdAt: -1 });
    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// Update status (user)
router.patch('/task/status/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Find the user's assignment in the assignedTo array
    const userAssignment = task.assignedTo.find(assignment => assignment.user.toString() === req.userId.toString());
    if (!userAssignment) {
      return res.status(403).json({ message: 'Access denied to update this task' });
    }

    // If user selects "Completed", set to "Pending Approval" instead
    const actualStatus = status === 'Completed' ? 'Pending Approval' : status;

    // Update the user's individual status
    userAssignment.status = actualStatus;

    // Derive overall task status based on individual statuses
    const allStatuses = task.assignedTo.map(a => a.status);
    if (allStatuses.every(s => s === 'Completed')) {
      task.status = 'Completed';
    } else if (allStatuses.some(s => s === 'Pending Approval')) {
      task.status = 'Pending Approval';
    } else if (allStatuses.some(s => s === 'In Progress')) {
      task.status = 'In Progress';
    } else {
      task.status = 'Pending';
    }

    await task.save();
    const updatedTask = await Task.findById(req.params.id).populate('assignedTo.user', 'name').populate('createdBy', 'name').populate('comments.createdBy', 'name');
    return res.status(200).json({ message: 'Status updated', task: updatedTask });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating status', error: err.message });
  }
});

// Add comment to task (user and admin) with file attachments
router.post('/task/comment/:id', verifyToken, upload.array('attachments', 10), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { text } = req.body;
    if ((!text || !text.trim()) && (!req.files || req.files.length === 0)) return res.status(400).json({ message: 'Comment text or attachments are required' });

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date()
      }));
    }

    if (req.baseUrl === '/admin') {
      // Check if admin
      const id = req.user && (req.user.id || req.user._id || req.user.userId);
      if (!id) return res.status(401).json({ message: 'Missing id in token' });
      const admin = await Admin.findById(id);
      if (!admin) return res.status(403).json({ message: 'Admin access required' });
      req.adminId = admin._id;

      task.comments.push({
        text: text ? text.trim() : (attachments.length > 0 ? '[Attachment]' : ''),
        attachments: attachments,
        createdBy: req.adminId,
        createdByModel: 'Admin',
        createdAt: new Date()
      });
    } else if (req.baseUrl === '/user') {
      const id = req.user && (req.user.id || req.user._id || req.user.userId);
      if (!id) return res.status(401).json({ message: 'Missing id in token' });
      const user = await User.findById(id);
      if (!user) return res.status(403).json({ message: 'User access required' });
      req.userId = user._id;

      // Check if the user is assigned to this task
      const userAssignment = task.assignedTo.find(assignment => assignment.user.equals(req.userId));
      if (!userAssignment) {
        return res.status(403).json({ message: 'Access denied to comment on this task' });
      }

      task.comments.push({
        text: text ? text.trim() : (attachments.length > 0 ? '[Attachment]' : ''),
        attachments: attachments,
        createdBy: req.userId,
        createdByModel: 'User',
        createdAt: new Date()
      });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await task.save();
    const updatedTask = await Task.findById(req.params.id).populate('comments.createdBy', 'name');
    return res.status(201).json({ message: 'Comment added', task: updatedTask });
  } catch (err) {
    return res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
});

// Get single task details (admin and user)
router.get('/task/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo.user', 'name')
      .populate('createdBy', 'name')
      .populate('comments.createdBy', 'name')
      .populate('subtasks.assignedTo', 'name _id');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.baseUrl === '/admin') {
      const subtasks = task.subtasks || [];
      return res.status(200).json({ task, subtasks, comments: task.comments });
    } else if (req.baseUrl === '/user') {
      const id = req.user && (req.user.id || req.user._id || req.user.userId);
      if (!id) return res.status(401).json({ message: 'Missing id in token' });
      const user = await User.findById(id);
      if (!user) return res.status(403).json({ message: 'User access required' });
      req.userId = user._id;
      // Check if the user is assigned to this task or any of its subtasks
      const isAssigned = task.assignedTo.some(assignment => assignment.user.equals(req.userId));
      const isAssignedToSubtask = task.subtasks.some(subtask => subtask.assignedTo.equals(req.userId));
      if (!isAssigned && !isAssignedToSubtask) {
        return res.status(403).json({ message: 'Access denied to view this task' });
      }
      return res.status(200).json({ task, subtasks: task.subtasks, comments: task.comments });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching task details', error: err.message });
  }
});

// Add subtask to task (admin)
router.post('/task/subtask/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, assignedTo } = req.body;
    if (!title || !assignedTo) return res.status(400).json({ message: 'Title and assignedTo are required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if the assigned user is already in the task's assignedTo array
    const isUserAssigned = task.assignedTo.some(assignment => assignment.user.toString() === assignedTo.toString());
    if (!isUserAssigned) {
      // Add the user to the task's assignedTo array with status 'Pending'
      task.assignedTo.push({
        user: assignedTo,
        status: 'Pending'
      });
    }

    // For now, we'll store subtasks as part of the task document
    // In a real application, you might want a separate Subtask model
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      title,
      assignedTo,
      status: 'Pending',
      createdAt: new Date()
    });

    await task.save();
    const updatedTask = await Task.findById(req.params.id)
      .populate('assignedTo.user', 'name')
      .populate('createdBy', 'name')
      .populate('comments.createdBy', 'name');

    return res.status(201).json({ message: 'Subtask added', subtasks: task.subtasks });
  } catch (err) {
    return res.status(500).json({ message: 'Error adding subtask', error: err.message });
  }
});

// Update subtask status (admin)
router.put('/task/subtask/:subtaskId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    // Find the task that contains this subtask
    const task = await Task.findOne({ 'subtasks._id': req.params.subtaskId });
    if (!task) return res.status(404).json({ message: 'Subtask not found' });

    // Find and update the subtask
    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    subtask.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo.user', 'name')
      .populate('createdBy', 'name')
      .populate('comments.createdBy', 'name');

    return res.status(200).json({ message: 'Subtask updated', subtasks: task.subtasks });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating subtask', error: err.message });
  }
});

// Update subtask status (user)
router.patch('/task/subtask/:subtaskId', verifyToken, requireUser, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    // Find the task that contains this subtask
    const task = await Task.findOne({ 'subtasks._id': req.params.subtaskId });
    if (!task) return res.status(404).json({ message: 'Subtask not found' });

    // Check if the user is assigned to the task
    const isAssignedToTask = task.assignedTo.some(assignment => assignment.user.toString() === req.userId.toString());
    if (!isAssignedToTask) {
      return res.status(403).json({ message: 'Access denied to update this subtask' });
    }

    // Find the subtask
    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    subtask.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo.user', 'name')
      .populate('createdBy', 'name')
      .populate('comments.createdBy', 'name');

    return res.status(200).json({ message: 'Subtask updated', task: updatedTask });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating subtask', error: err.message });
  }
});



// Add message to task (user)
router.post('/user/task/message/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if the user is assigned to this task
    const userAssignment = task.assignedTo.find(assignment => assignment.user.toString() === req.userId.toString());
    if (!userAssignment) {
      return res.status(403).json({ message: 'Access denied to message on this task' });
    }

    task.messages.push({
      text: text.trim(),
      createdBy: req.userId,
      createdByModel: 'User',
      createdAt: new Date()
    });

    await task.save();
    const updatedTask = await Task.findById(req.params.id).populate('messages.createdBy', 'name');
    return res.status(201).json({ message: 'Message added', task: updatedTask });
  } catch (err) {
    return res.status(500).json({ message: 'Error adding message', error: err.message });
  }
});

// Approve or reject task (admin)
router.patch('/task/approve/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Completed', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (Completed or Pending) is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if task is in "Pending Approval" status
    if (task.status !== 'Pending Approval') {
      return res.status(400).json({ message: 'Task is not pending approval' });
    }

    if (status === 'Completed') {
      // Set all "Pending Approval" assignments to "Completed"
      task.assignedTo.forEach(assignment => {
        if (assignment.status === 'Pending Approval') {
          assignment.status = 'Completed';
        }
      });
      // Set overall task status to "Completed"
      task.status = 'Completed';
      message = 'Task approved and completed';
    } else if (status === 'Pending') {
      // Set all "Pending Approval" assignments back to "Pending"
      task.assignedTo.forEach(assignment => {
        if (assignment.status === 'Pending Approval') {
          assignment.status = 'Pending';
        }
      });
      // Set overall task status to "Pending"
      task.status = 'Pending';
      message = 'Task rejected and set to pending';
    }

    await task.save();
    const updatedTask = await Task.findById(req.params.id).populate('assignedTo.user', 'name').populate('createdBy', 'name').populate('comments.createdBy', 'name');
    return res.status(200).json({ message, task: updatedTask });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating task', error: err.message });
  }
});

// Download comment attachment
router.get('/task/comment/attachment/:commentId/:fileName', verifyToken, async (req, res) => {
  try {
    const { commentId, fileName } = req.params;
    const task = await Task.findOne({ 'comments._id': commentId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const comment = task.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const attachment = comment.attachments.find(att => att.originalname === decodeURIComponent(fileName));
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

    // Check permissions based on user type
    if (req.baseUrl === '/admin') {
      const id = req.user && (req.user.id || req.user._id || req.user.userId);
      if (!id) return res.status(401).json({ message: 'Missing id in token' });
      const admin = await Admin.findById(id);
      if (!admin) return res.status(403).json({ message: 'Admin access required' });
    } else if (req.baseUrl === '/user') {
      const id = req.user && (req.user.id || req.user._id || req.user.userId);
      if (!id) return res.status(401).json({ message: 'Missing id in token' });
      const user = await User.findById(id);
      if (!user) return res.status(403).json({ message: 'User access required' });
      req.userId = user._id;

      // Check if the user is assigned to this task
      const isAssigned = task.assignedTo.some(assignment => assignment.user.equals(req.userId));
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied to download this attachment' });
      }
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const filePath = path.join(__dirname, '../multer', fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath);
  } catch (err) {
    return res.status(500).json({ message: 'Error downloading attachment', error: err.message });
  }
});

// Download attachment
router.get('/task/attachment/:filename', verifyToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../multer', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to this task (by finding the task that contains this attachment)
    const task = await Task.findOne({
      $or: [
        { 'comments.attachments.filename': filename },
        { 'messages.attachments.filename': filename }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions based on user type
    if (req.baseUrl === '/admin') {
      const id = req.user && (req.user.id || req.user._id || req.user.userId);
      if (!id) return res.status(401).json({ message: 'Missing id in token' });
      const admin = await Admin.findById(id);
      if (!admin) return res.status(403).json({ message: 'Admin access required' });
    } else if (req.baseUrl === '/user') {
      const id = req.user && (req.user.id || req.user._id || req.user.userId);
      if (!id) return res.status(401).json({ message: 'Missing id in token' });
      const user = await User.findById(id);
      if (!user) return res.status(403).json({ message: 'User access required' });
      req.userId = user._id;

      // Check if the user is assigned to this task
      const isAssigned = task.assignedTo.some(assignment => assignment.user.equals(req.userId));
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied to download this attachment' });
      }
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Send the file
    res.download(filePath);
  } catch (err) {
    return res.status(500).json({ message: 'Error downloading file', error: err.message });
  }
});

// Generate PDF report for a task (admin)
router.get('/task/report/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo.user', 'name')
      .populate('createdBy', 'name')
      .populate('comments.createdBy', 'name')
      .populate('subtasks.assignedTo', 'name')
      .populate('department', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `Task_Report_${task.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Task Complete Report', { align: 'center' });
    doc.moveDown();

    // Task Title
    doc.fontSize(16).text(`Title: ${task.title}`);
    doc.moveDown();

    // Description
    doc.fontSize(12).text('Description:');
    doc.fontSize(10).text(task.description || 'No description provided');
    doc.moveDown();

    // Status
    doc.fontSize(12).text(`Status: ${task.status}`);
    doc.moveDown();

    // Due Date
    doc.fontSize(12).text(`Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}`);
    doc.moveDown();

    // Created By
    doc.fontSize(12).text(`Created By: ${task.createdBy?.name || 'Unknown'}`);
    doc.moveDown();

    // Department
    doc.fontSize(12).text(`Department: ${task.department?.name || 'Unknown'}`);
    doc.moveDown();

    // Assigned Users
    doc.fontSize(14).text('Assigned Users:');
    if (task.assignedTo && task.assignedTo.length > 0) {
      task.assignedTo.forEach((assignment, index) => {
        doc.fontSize(10).text(`${index + 1}. ${assignment.user?.name || 'Unknown User'} - Status: ${assignment.status}`);
      });
    } else {
      doc.fontSize(10).text('No users assigned');
    }
    doc.moveDown();

    // Subtasks
    doc.fontSize(14).text('Subtasks:');
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach((subtask, index) => {
        doc.fontSize(10).text(`${index + 1}. ${subtask.title} - Status: ${subtask.status}`);
        if (subtask.description) {
          doc.fontSize(8).text(`   Description: ${subtask.description}`);
        }
        doc.fontSize(8).text(`   Assigned to: ${subtask.assignedTo?.name || 'Unknown'}`);
      });
    } else {
      doc.fontSize(10).text('No subtasks');
    }
    doc.moveDown();

    // Comments
    doc.fontSize(14).text('Comments:');
    if (task.comments && task.comments.length > 0) {
      task.comments.forEach((comment, index) => {
        doc.fontSize(10).text(`${index + 1}. ${comment.createdBy?.name || 'Unknown'}: ${comment.text}`);
        doc.fontSize(8).text(`   Date: ${new Date(comment.createdAt).toLocaleString()}`);
      });
    } else {
      doc.fontSize(10).text('No comments');
    }

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('Error generating PDF report:', err);
    return res.status(500).json({ message: 'Error generating PDF report', error: err.message });
  }
});

module.exports = router;
