const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Letter = require('../models/Letter');
const jwt = require('jsonwebtoken');

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-googleAccessToken -googleRefreshToken');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all letters
router.get('/letters', authenticateAdmin, async (req, res) => {
  try {
    const letters = await Letter.find();
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single letter
router.get('/letters/:id', authenticateAdmin, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id).populate('user', 'name email');
    
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    
    res.json(letter);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a letter
router.delete('/letters/:id', authenticateAdmin, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    
    await Letter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Promote a user to admin
router.put('/users/:id/promote', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = 'admin';
    await user.save();
    
    res.json({ message: 'User promoted to admin successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Demote an admin to regular user
router.put('/users/:id/demote', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent self-demotion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot demote yourself' });
    }
    
    user.role = 'user';
    await user.save();
    
    res.json({ message: 'Admin demoted to regular user successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;