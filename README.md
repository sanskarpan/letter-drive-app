# Letter Drive App

A full-stack web application that allows users to create and edit text-based letters and save them to Google Drive.

## Features

- Google Authentication
- Rich Text Editor for creating and editing letters
- Save letters locally and to Google Drive
- Admin dashboard for user management
- Responsive design

## Technology Stack

- **Frontend**: React.js with Material UI
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: Google OAuth
- **Storage**: Google Drive API
- **Deployment**: Vercel (Frontend) and Render/Heroku (Backend)

## Getting Started

### Prerequisites

- Node.js and npm installed
- MongoDB installed locally or MongoDB Atlas account
- Google Cloud Platform account with OAuth 2.0 credentials and Google Drive API enabled

### Installation

#### Backend Setup

1. Clone the repository
```
git clone https://github.com/sanskarpan/letter-drive-app.git
cd letter-drive-app/server
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL = https://letter-drive-api.onrender.com/api/auth/google/callback
CLIENT_URL=http://localhost:3000
```

4. Start the server
```
npm run dev
```

#### Frontend Setup

1. Navigate to the client directory
```
cd ../client
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the client directory with the following variables:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

4. Start the client
```
npm start
```

## Project Structure

```
letter-drive-app/
├── client/                  # Frontend React application
│   ├── public/              # Public assets
│   ├── src/                 # Source files
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── App.js           # Main App component
│   │   └── index.js         # Entry point
│   ├── .env                 # Environment variables
│   └── package.json         # Dependencies and scripts
├── server/                  # Backend Express application
│   ├── config/              # Configuration files
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── .env                 # Environment variables
│   ├── index.js             # Entry point
│   └── package.json         # Dependencies and scripts
└── README.md                # Project documentation
```

## API Endpoints

### Authentication

- `GET /api/auth/google`: Google OAuth login
- `GET /api/auth/google/callback`: Google OAuth callback
- `GET /api/auth/check`: Check if user is authenticated
- `GET /api/auth/logout`: Logout user

### Letters

- `GET /api/letters`: Get all letters for the logged-in user
- `GET /api/letters/:id`: Get a single letter
- `POST /api/letters`: Create a new letter
- `PUT /api/letters/:id`: Update a letter
- `DELETE /api/letters/:id`: Delete a letter

### Admin

- `GET /api/admin/users`: Get all users (admin only)
- `GET /api/admin/letters`: Get all letters (admin only)
- `GET /api/admin/letters/:id`: Get a single letter (admin only)
- `DELETE /api/admin/letters/:id`: Delete a letter (admin only)
- `PUT /api/admin/users/:id/promote`: Promote a user to admin (admin only)
- `PUT /api/admin/users/:id/demote`: Demote an admin to regular user (admin only)

## Google Drive Integration

The application uses the Google Drive API to:
1. Create a "Letters" folder in the user's Google Drive
2. Save letters as Google Docs
3. Update existing letters in Google Drive

## Security Considerations

- JWT-based authentication
- Proper OAuth scope restrictions
- Secure handling of API keys and tokens
- Role-based access control

## Future Enhancements

- Real-time collaboration using WebSockets
- Email notifications
- Template system for letters
- Export options (PDF, Word, etc.)
- Advanced formatting options

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google for their OAuth and Drive APIs
- MongoDB for the database
- React and Material UI for the frontend framework