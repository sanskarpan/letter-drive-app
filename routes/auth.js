const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Google OAuth login
router.get(
  '/google',
  (req, res, next) => {
    console.log('Starting Google OAuth flow');
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Create JWT token with sufficient expiration time
    const token = jwt.sign(
      { 
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Redirect to frontend with token
    console.log(`Redirecting to ${process.env.CLIENT_URL}/login?token=${token}`);
    res.redirect(`${process.env.CLIENT_URL}/login?token=${token}`);
  }
);

// Check if user is authenticated
router.get('/check', (req, res) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ isAuthenticated: true, user: decoded });
  } catch (error) {
    res.status(401).json({ isAuthenticated: false, message: 'Unauthorized: Invalid token' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  console.log('User logout requested');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;