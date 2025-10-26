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
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashed });
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
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await User.findOne({ email });
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

        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ user });
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching profile', error: err.message });
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