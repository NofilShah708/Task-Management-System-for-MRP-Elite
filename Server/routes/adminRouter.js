const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/adminModel'); // Assuming Admin model is in models folder
const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const Task = require('../models/taskModel');
const router = express.Router();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { verifyToken } = require('../utils/tokenVerification');
router.use(cookieParser());

// Create a new admin
router.post('/create', async (req, res) => {
    try {
        const { name, password, userid, department } = req.body;

        // Check if admin with this userid already exists
        const existingAdmin = await Admin.findOne({ userid });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Userid already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({ name, password: hashedPassword, userid, department });
        await newAdmin.save();

        const token = jwt.sign({ id: newAdmin._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        // avoid returning password to client
        const adminSafe = newAdmin.toObject();
        delete adminSafe.password;

        return res.status(201).json({ message: 'Admin created successfully', admin: adminSafe, token });
    } catch (error) {
        return res.status(500).json({ message: 'Error creating admin', error: error.message });
    }
});

// Admin login
router.post('/login',  async (req, res) => {
    try {
        const { userid, password } = req.body;
        const admin = await Admin.findOne({ userid });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        const adminSafe = admin.toObject();
        delete adminSafe.password;

        return res.status(200).json({ message: 'Login successful', admin: adminSafe, token });
    } catch (error) {
        return res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId).select('-password').populate('department', 'name');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        return res.status(200).json({ admin });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Update admin profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, userid, email } = req.body;
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if userid is already taken by another admin
        if (userid && userid !== admin.userid) {
            const existingAdmin = await Admin.findOne({ userid });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Userid already exists' });
            }
        }

        admin.name = name || admin.name;
        admin.userid = userid || admin.userid;
        admin.email = email || admin.email;
        await admin.save();

        const adminSafe = admin.toObject();
        delete adminSafe.password;

        return res.status(200).json({ message: 'Profile updated successfully', admin: adminSafe });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

// Update admin password
router.put('/password', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await admin.save();

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating password', error: error.message });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
});

// Get all users (for admin dashboard), optionally filter by department
router.get('/users', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const filter = {};
        if (req.query.department) {
            filter.departments = req.query.department;
        }

        const users = await User.find(filter).select('-password').populate('departments', 'name');
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get user details with tasks (for admin to view user profile with tasks)
router.get('/users/:id', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const userId = req.params.id;
        const user = await User.findById(userId).select('-password').populate('departments', 'name');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch tasks assigned to this user
        const tasks = await Task.find({ 'assignedTo.user': userId })
            .populate('assignedTo.user', 'name')
            .populate('createdBy', 'name')
            .populate('comments.createdBy', 'name')
            .sort({ dueDate: 1, createdAt: -1 });

        return res.status(200).json({ user, tasks });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching user details', error: error.message });
    }
});

// Delete user by ID (for admin)
router.delete('/users/:id', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) { 
        return res.status(500).json({ message: 'Error deleting user', error: error.message });
    }   
});

// Create department (for admin)
router.post('/departments', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const { name, description } = req.body;

        const existingDepartment = await Department.findOne({ name });
        if (existingDepartment) {
            return res.status(400).json({ message: 'Department already exists' });
        }

        const newDepartment = new Department({ name, description });
        await newDepartment.save();

        return res.status(201).json({ message: 'Department created successfully', department: newDepartment });
    } catch (error) {
        return res.status(500).json({ message: 'Error creating department', error: error.message });
    }
});

// Get all departments (for admin)
router.get('/departments', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const departments = await Department.find();
        return res.status(200).json({ departments });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching departments', error: error.message });
    }
});

// Get department by ID (for admin)
router.get('/departments/:id', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const departmentId = req.params.id;
        const department = await Department.findById(departmentId);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        return res.status(200).json({ department });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching department', error: error.message });
    }
});

// Create user or admin (for admin)
router.post('/users', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const { name, email, userid, password, role, departments } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Set email to undefined if empty string to avoid unique constraint issues
        const processedEmail = email === '' ? undefined : email;

        // Validate departments if provided (array)
        if (departments && Array.isArray(departments)) {
            for (const deptId of departments) {
                if (deptId) {
                    const deptExists = await Department.findById(deptId);
                    if (!deptExists) {
                        return res.status(400).json({ message: `Invalid department ID: ${deptId}` });
                    }
                }
            }
        }

        if (role === 'admin') {
            const existingAdmin = await Admin.findOne({ userid });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Userid already exists for admin' });
            }
            const newAdmin = new Admin({ name, email: processedEmail, userid, password: hashedPassword, role: 'admin', departments: departments || [] });
            await newAdmin.save();
            const adminSafe = newAdmin.toObject();
            delete adminSafe.password;
            return res.status(201).json({ message: 'Admin created successfully', user: adminSafe });
        } else {
            const existingUser = await User.findOne({ userid });
            if (existingUser) {
                return res.status(400).json({ message: 'Userid already exists for user' });
            }
            const newUser = new User({ name, email: processedEmail, userid, password: hashedPassword, role: 'employee', departments: departments || [] });
            await newUser.save();
            const userSafe = newUser.toObject();
            delete userSafe.password;
            return res.status(201).json({ message: 'User created successfully', user: userSafe });
        }

    } catch (error) {
        return res.status(500).json({ message: 'Error creating user/admin', error: error.message });
    }
});

module.exports = router;
