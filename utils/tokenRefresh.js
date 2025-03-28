const { google } = require('googleapis');

/**
 * Refreshes a Google API access token using the refresh token
 * @param {string} refreshToken - The refresh token from the original OAuth flow
 * @returns {Promise<string>} - The new access token
 */
const refreshGoogleToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      '/api/auth/google/callback'
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

module.exports = { refreshGoogleToken };