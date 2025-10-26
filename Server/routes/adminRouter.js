const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/adminModel'); // Assuming Admin model is in models folder
const User = require('../models/userModel');
const router = express.Router();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { verifyToken } = require('../utils/tokenVerification');
router.use(cookieParser());

// Create a new admin
router.post('/create', async (req, res) => {
    try {
        const { name, password, email } = req.body;

        // Check if admin with this email already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({ name, password: hashedPassword, email });
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
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
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
        const admin = await Admin.findById(req.adminId).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        return res.status(200).json({ admin });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
});

// Get all users (for admin dashboard)
router.get('/users', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const users = await User.find().select('-password');
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching users', error: error.message });
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

// Create user or admin (for admin)
router.post('/users', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === 'admin') {
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Email already exists for admin' });
            }
            const newAdmin = new Admin({ name, email, password: hashedPassword, role: 'admin' });
            await newAdmin.save();
            const adminSafe = newAdmin.toObject();
            delete adminSafe.password;
            return res.status(201).json({ message: 'Admin created successfully', user: adminSafe });
        } else {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists for user' });
            }
            const newUser = new User({ name, email, password: hashedPassword, role: 'employee' });
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
