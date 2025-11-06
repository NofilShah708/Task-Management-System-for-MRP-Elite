const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('../models/userModel'); // ensure this file exists (schema with at least email, password, name)
const { verifyToken } = require('../utils/tokenVerification');

const router = express.Router();
router.use(cookieParser());

// Register / Create employee
router.post('/create', async (req, res) => {
    try {
        const { name, email, userid, password, department } = req.body;
        if (!name || !email || !userid || !password) {
            return res.status(400).json({ message: 'Name, userid and password are required' });
        }

        const existingUserid = await User.findOne({ userid });
        if (existingUserid) {
            return res.status(409).json({ message: 'User with this userid already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, userid, password: hashed, department });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        // set cookie before sending response
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        const safe = user.toObject();
        delete safe.password;

        return res.status(201).json({ message: 'User created', user: safe, token });
    } catch (err) {
        return res.status(500).json({ message: 'Error creating user', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { userid, password } = req.body;
        if (!userid || !password) {
            return res.status(400).json({ message: 'Userid and password required' });
        }

        const user = await User.findOne({ userid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        const safe = user.toObject();
        delete safe.password;

        return res.status(200).json({ message: 'Login successful', user: safe, token });
    } catch (err) {
        return res.status(500).json({ message: 'Error logging in', error: err.message });
    }
});

// Protected profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        // tokenVerification attaches decoded payload to req.user and (depending on its implementation) may set req.adminId
        const id = (req.user && (req.user.id || req.user._id || req.user.userId)) || req.adminId || req.userId;
        if (!id) {
            return res.status(401).json({ message: 'Unable to determine user id from token' });
        }

        const user = await User.findById(id).select('-password').populate('departments', 'name');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ user });
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
});

// Update profile (users can update name and userid, not department)
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const id = (req.user && (req.user.id || req.user._id || req.user.userId)) || req.adminId || req.userId;
        if (!id) {
            return res.status(401).json({ message: 'Unable to determine user id from token' });
        }

        const { name, userid } = req.body;
        if (!name || !userid) {
            return res.status(400).json({ message: 'Name and userid are required' });
        }

        // Check if userid is already taken by another user
        const existingUser = await User.findOne({ userid, _id: { $ne: id } });
        if (existingUser) {
            return res.status(409).json({ message: 'Userid already in use by another user' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, userid },
            { new: true, runValidators: true }
        ).select('-password').populate('department', 'name');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (err) {
        return res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
});

// Update password
router.put('/password', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const id = (req.user && (req.user.id || req.user._id || req.user.userId)) || req.adminId || req.userId;
        if (!id) {
            return res.status(401).json({ message: 'Unable to determine user id from token' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Error updating password', error: err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    // clear cookie and respond
    if (typeof res.clearCookie === 'function') {
        res.clearCookie('token');
    }
    return res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
