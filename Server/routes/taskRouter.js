// ...existing code...
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/tokenVerification');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');

// Allowed status values for tasks
const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Completed', 'Blocked'];

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
    const id = (req.user && (req.user.id || req.user._id || req.user.userId)) || req.adminId;
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
    const { title, description, assignedTo, dueDate, priority, status, comments } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
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
      comments: processedComments
    });

    await task.save();
    return res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    return res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

// Update task
router.put('/task/update/:id', verifyToken, requireAdmin, async (req, res) => {
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
    const tasks = await Task.find(filter).populate('assignedTo.user', 'name').populate('createdBy', 'name').populate('comments.createdBy', 'name').sort({ createdAt: -1 });
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
    const filter = { 'assignedTo.user': req.userId };
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

    // Update the user's individual status
    userAssignment.status = status;

    // Derive overall task status based on individual statuses
    const allStatuses = task.assignedTo.map(a => a.status);
    if (allStatuses.every(s => s === 'Completed')) {
      task.status = 'Completed';
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

// Add comment to task (admin or user)
router.post('/task/comment/:id', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Determine if admin or user based on baseUrl
    let commenterId, commenterModel, isAdmin = false;
    if (req.baseUrl === '/admin') {
      // Admin route
      const admin = await Admin.findById(req.adminId);
      if (!admin) return res.status(403).json({ message: 'Admin access required' });
      commenterId = req.adminId;
      commenterModel = 'Admin';
      isAdmin = true;
    } else if (req.baseUrl === '/user') {
      // User route
      const user = await User.findById(req.adminId); // req.adminId is actually the user id from token
      if (!user) return res.status(403).json({ message: 'User access required' });
      const userAssignment = task.assignedTo.find(assignment => assignment.user.toString() === user._id.toString());
      if (!userAssignment) {
        return res.status(403).json({ message: 'Access denied to comment on this task' });
      }
      commenterId = user._id;
      commenterModel = 'User';
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    task.comments.push({
      text: text.trim(),
      createdBy: commenterId,
      createdByModel: commenterModel,
      createdAt: new Date()
    });

    await task.save();
    const updatedTask = await Task.findById(req.params.id).populate('comments.createdBy', 'name');
    return res.status(201).json({ message: 'Comment added', task: updatedTask });
  } catch (err) {
    return res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
});

module.exports = router;
// ...existing code...
