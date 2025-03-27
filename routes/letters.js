// server/routes/letters.js
const express = require('express');
const router = express.Router();
const Letter = require('../models/Letter');
const User = require('../models/User');
const { getOrCreateLettersFolder, saveLetterToDrive, getLetterFromDrive } = require('../utils/driveUtils');
const { refreshGoogleToken } = require('../utils/tokenRefresh');
const jwt = require('jsonwebtoken');

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Get all letters for the logged-in user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const letters = await Letter.find({ user: req.user.id });
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single letter
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    
    if (letter.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this letter' });
    }
    
    res.json(letter);
  } catch (error) {
    console.error('Error fetching letter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new letter
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, content, saveToGoogleDrive } = req.body;
    
    // Create letter in our database
    const letter = new Letter({
      title,
      content,
      user: req.user.id
    });
    
    await letter.save();
    
    // If user wants to save to Google Drive
    if (saveToGoogleDrive) {
      try {
        // Get user with Google tokens
        const user = await User.findById(req.user.id);
        
        if (!user) {
          return res.status(400).json({ message: 'User not found' });
        }
        
        if (!user.googleAccessToken) {
          return res.status(400).json({ message: 'Google Drive access not available' });
        }
        
        let accessToken = user.googleAccessToken;
        
        // Try to refresh token if we have a refresh token
        if (user.googleRefreshToken) {
          try {
            accessToken = await refreshGoogleToken(user.googleRefreshToken);
            // Update the user with the new access token
            user.googleAccessToken = accessToken;
            await user.save();
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // Continue with the existing token
          }
        }
        
        // Get or create Letters folder in Google Drive
        const folderId = await getOrCreateLettersFolder(accessToken);
        
        // Save letter to Google Drive
        const driveFile = await saveLetterToDrive(
          accessToken,
          title,
          content,
          folderId
        );
        
        // Update letter with Google Drive ID
        letter.googleDriveId = driveFile.id;
        await letter.save();
      } catch (error) {
        console.error('Error saving to Google Drive:', error);
        // Still return the letter, but with a warning
        return res.status(201).json({ 
          letter, 
          warning: 'Letter saved locally but could not be saved to Google Drive' 
        });
      }
    }
    
    res.status(201).json(letter);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a letter
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { title, content, saveToGoogleDrive } = req.body;
    
    // Find the letter
    let letter = await Letter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    
    // Check ownership
    if (letter.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this letter' });
    }
    
    // Update letter in our database
    letter.title = title;
    letter.content = content;
    await letter.save();
    
    // If letter should be saved to Google Drive
    if (saveToGoogleDrive) {
      try {
        // Get user with Google tokens
        const user = await User.findById(req.user.id);
        
        if (!user) {
          return res.status(400).json({ message: 'User not found' });
        }
        
        if (!user.googleAccessToken) {
          return res.status(400).json({ message: 'Google Drive access not available' });
        }
        
        let accessToken = user.googleAccessToken;
        
        // Try to refresh token if we have a refresh token
        if (user.googleRefreshToken) {
          try {
            accessToken = await refreshGoogleToken(user.googleRefreshToken);
            // Update the user with the new access token
            user.googleAccessToken = accessToken;
            await user.save();
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // Continue with the existing token
          }
        }
        
        // Get or create Letters folder in Google Drive
        const folderId = await getOrCreateLettersFolder(accessToken);
        
        // Update in Google Drive if it exists, otherwise create new
        const driveFile = await saveLetterToDrive(
          accessToken,
          title,
          content,
          folderId,
          letter.googleDriveId
        );
        
        // Update letter with Google Drive ID if it's a new file
        if (!letter.googleDriveId && driveFile.id) {
          letter.googleDriveId = driveFile.id;
          await letter.save();
        }
      } catch (error) {
        console.error('Error saving to Google Drive:', error);
        return res.json({ 
          ...letter.toObject(), 
          warning: 'Letter updated locally but could not be saved to Google Drive' 
        });
      }
    }
    
    res.json(letter);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a letter
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    
    if (letter.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this letter' });
    }
    
    await Letter.findByIdAndDelete(req.params.id);
    
    // Note: We're not deleting from Google Drive for safety
    // If required, we could add that functionality
    
    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;