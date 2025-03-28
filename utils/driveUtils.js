const { google } = require('googleapis');
const User = require('../models/User');
const { refreshGoogleToken } = require('./tokenRefresh');

// Create a Google Drive client
const createDriveClient = (accessToken) => {
  if (!accessToken) {
    console.error('No access token provided to createDriveClient');
    throw new Error('Access token is required to create Drive client');
  }
  
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    return google.drive({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('Error creating Google Drive client:', error);
    throw error;
  }
};

// Create or get the Letters folder in Google Drive
const getOrCreateLettersFolder = async (accessToken) => {
  if (!accessToken) {
    console.error('No access token provided to getOrCreateLettersFolder');
    throw new Error('Access token is required to access Google Drive');
  }

  try {
    const drive = createDriveClient(accessToken);
    
    // Check if Letters folder exists
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='Letters' and trashed=false",
      fields: 'files(id, name)'
    });

    if (response.data.files.length > 0) {
      // Folder exists, return its ID
      return response.data.files[0].id;
    }

    // Folder doesn't exist, create it
    const folderMetadata = {
      name: 'Letters',
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    return folder.data.id;
  } catch (error) {
    console.error('Error accessing Google Drive:', error);
    throw error;
  }
};

// Save letter to Google Drive
const saveLetterToDrive = async (accessToken, title, content, folderId, fileId = null) => {
  if (!accessToken) {
    throw new Error('Access token is required to save to Google Drive');
  }

  try {
    const drive = createDriveClient(accessToken);
    const textContent = content.replace(/<[^>]*>?/gm, '');
    
    // Prepare file metadata
    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document'
    };
    
    // If folderId is provided, set the parent folder
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    
    let response;
    
    try {
      if (fileId) {
        // Update existing file
        response = await drive.files.update({
          fileId: fileId,
          resource: fileMetadata,
          media: {
            mimeType: 'text/plain',
            body: textContent
          }
        });
      } else {
        // Create new file
        response = await drive.files.create({
          resource: fileMetadata,
          media: {
            mimeType: 'text/plain',
            body: textContent
          },
          fields: 'id,webViewLink'
        });
      }
      
      return response.data;
    } catch (error) {
      // Check if token has expired
      if (error.code === 401) {
        throw new Error('Google Drive access token expired or invalid');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error saving to Google Drive:', error);
    throw error;
  }
};

// Get letter from Google Drive
const getLetterFromDrive = async (accessToken, fileId) => {
  try {
    const drive = createDriveClient(accessToken);
    
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,webViewLink'
    });
    
    const content = await drive.files.export({
      fileId: fileId,
      mimeType: 'text/plain'
    });
    
    return {
      id: file.data.id,
      title: file.data.name,
      content: content.data,
      webViewLink: file.data.webViewLink
    };
  } catch (error) {
    console.error('Error getting file from Google Drive:', error);
    throw error;
  }
};

module.exports = {
  createDriveClient,
  getOrCreateLettersFolder,
  saveLetterToDrive,
  getLetterFromDrive
};