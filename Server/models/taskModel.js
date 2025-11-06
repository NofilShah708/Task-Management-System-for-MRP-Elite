const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: "Pending" },
  dueDate: Date,
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },

  // 🔗 Relationships
  assignedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Employees who will do it
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Blocked', 'Pending Approval'],
      default: 'Pending'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin", // Admin who created it
    required: true
  },

  // Comments section
  comments: [{
    text: { type: String, required: true }, // Comment text
    attachments: [{
      filename: { type: String, required: true },
      originalname: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true },
      path: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'comments.createdByModel', // Dynamic reference to Admin or User
      required: true
    },
    createdByModel: {
      type: String,
      required: true,
      enum: ['Admin', 'User'] // Specifies the model for the reference
    },
    createdAt: { type: Date, default: Date.now } // Timestamp for the comment
  }],

  // Messages section for direct task communication
  messages: [{
    text: { type: String, required: true }, // Message text
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'messages.createdByModel', // Dynamic reference to Admin or User
      required: true
    },
    createdByModel: {
      type: String,
      required: true,
      enum: ['Admin', 'User'] // Specifies the model for the reference
    },
    createdAt: { type: Date, default: Date.now } // Timestamp for the message
  }],

  // Subtasks section
  subtasks: [{
    title: { type: String, required: true },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Blocked', 'Pending Approval'],
      default: 'Pending'
    },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });



module.exports = mongoose.model("Task", taskSchema);
