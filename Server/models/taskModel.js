const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: "Pending" },
  dueDate: Date,
  
  // 🔗 Relationships
  assignedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Employees who will do it
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
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
  }]
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);