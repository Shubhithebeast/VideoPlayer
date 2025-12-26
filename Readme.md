# uTube - Video Streaming Platform Backend

A professional backend application for a YouTube-like video streaming platform built with Node.js, Express, MongoDB, and Cloudinary.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Models](#models)
- [Middleware](#middleware)
- [Usage](#usage)

## ✨ Features

- **User Authentication & Authorization**
  - User registration with avatar and cover image upload
  - Secure login with JWT (Access & Refresh tokens)
  - Password hashing with bcrypt
  - Token refresh mechanism
  - Protected routes with JWT verification

- **User Management**
  - Update user profile details
  - Change password
  - Update avatar and cover images
  - Automatic deletion of old images from Cloudinary
  - View current user details

- **Media Management**
  - Image upload to Cloudinary
  - Automatic local file cleanup
  - Support for avatar and cover images
  - File validation with Multer

- **Video Platform Features** (Models Ready)
  - Video model with metadata
  - Subscription system
  - Watch history tracking

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5.2.1
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** Bcrypt
- **File Upload:** Multer
- **Cloud Storage:** Cloudinary
- **Dev Tools:** Nodemon, Prettier

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── user.controller.js      # User business logic
│   ├── database/
│   │   └── db.js                    # MongoDB connection
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT verification
│   │   └── multer.middleware.js     # File upload handling
│   ├── models/
│   │   ├── user.model.js            # User schema
│   │   ├── video.model.js           # Video schema
│   │   └── subscription.model.js    # Subscription schema
│   ├── routes/
│   │   └── user.routes.js           # User routes
│   ├── utils/
│   │   ├── apiError.js              # Custom error handler
│   │   ├── apiResponse.js           # Standardized response
│   │   ├── asyncHandler.js          # Async wrapper
│   │   └── cloudinary.js            # Cloudinary config
│   ├── app.js                       # Express app setup
│   ├── constants.js                 # App constants
│   └── index.js                     # Entry point
├── public/
│   └── temp/                        # Temporary file storage
├── .env                             # Environment variables
├── .gitignore
├── package.json
└── Readme.md
```

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd uTube/server
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
   - Create a `.env` file in the `server` directory
   - Add required environment variables (see below)

4. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:<PORT>`

## 🔐 Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=54112
CORS_ORIGIN=http://localhost:3000

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/youtubeDB?appName=Cluster0

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Configuration
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🔌 API Endpoints

### User Routes
Base URL: `/api/v1/users`

| Method | Endpoint | Description | Auth Required | Body/Files |
|--------|----------|-------------|---------------|------------|
| POST | `/register` | Register new user | No | `username`, `email`, `fullname`, `password`, `avatar` (file), `coverImage` (file, optional) |
| POST | `/login` | User login | No | `email` or `username`, `password` |
| POST | `/logout` | User logout | Yes | - |
| POST | `/refreshToken` | Refresh access token | No | `refreshToken` (body or cookie) |
| GET | `/getUser` | Get current user details | Yes | - |
| POST | `/changePassword` | Change password | Yes | `oldPassword`, `newPassword` |
| POST | `/updateAccountDetails` | Update profile | Yes | `fullname`, `email` |
| POST | `/updateAvatar` | Update avatar image | Yes | `avatar` (file) |
| POST | `/updateCoverImage` | Update cover image | Yes | `coverImage` (file) |

### Request Examples

**Register User**
```bash
POST /api/v1/users/register
Content-Type: multipart/form-data

Fields:
- username: john_doe
- email: john@example.com
- fullname: John Doe
- password: SecurePass123
- avatar: [FILE]
- coverImage: [FILE] (optional)
```

**Login**
```bash
POST /api/v1/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Update Avatar**
```bash
POST /api/v1/users/updateAvatar
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Fields:
- avatar: [FILE]
```

## 📊 Models

### User Model
```javascript
{
  username: String (unique, indexed),
  email: String (unique),
  fullname: String (indexed),
  avatar: String (URL),
  coverImage: String (URL),
  watchHistory: [ObjectId] (ref: Video),
  password: String (hashed),
  refreshToken: String,
  timestamps: true
}
```

### Video Model
```javascript
{
  videoFile: String (URL),
  thumbnail: String (URL),
  title: String,
  description: String,
  duration: Number,
  views: Number,
  isPublished: Boolean,
  owner: ObjectId (ref: User),
  timestamps: true
}
```

### Subscription Model
```javascript
{
  subscriber: ObjectId (ref: User),
  channel: ObjectId (ref: User),
  timestamps: true
}
```

## 🔒 Middleware

### Authentication Middleware (`verifyJWT`)
- Verifies JWT access token from cookies or Authorization header
- Attaches user object to `req.user`
- Returns 401 if token is invalid or expired

### Multer Middleware
- Handles multipart/form-data file uploads
- Stores files temporarily in `./public/temp`
- Supports single and multiple file uploads
- Configurations:
  - `upload.single(fieldname)` - Single file
  - `upload.fields([...])` - Multiple files with different field names

## 📝 Usage

### Testing with Postman

1. **Register a new user**
   - Set request to POST
   - URL: `http://localhost:54112/api/v1/users/register`
   - Body: form-data
   - Add fields: username, email, fullname, password
   - Add files: avatar (required), coverImage (optional)

2. **Login**
   - Returns `accessToken` and `refreshToken` in cookies and response body
   - Use accessToken for subsequent authenticated requests

3. **Access protected routes**
   - Add header: `Authorization: Bearer <your_access_token>`
   - Or ensure cookies are enabled in Postman

### Error Handling

All errors are handled consistently with the `apiError` class:
```javascript
{
  statusCode: Number,
  message: String,
  success: false,
  errors: Array
}
```

### Success Responses

All successful responses use the `apiResponse` class:
```javascript
{
  statusCode: Number,
  message: String,
  success: true,
  data: Object/Array
}
```

## 🔧 Development

### Code Formatting
```bash
npm run format  # If prettier script is configured
```

### Database
- MongoDB Atlas for production
- Automatic reconnection on connection loss
- Database name: `youtubeDB`

### File Upload Flow
1. Client uploads file via multipart/form-data
2. Multer saves file to `./public/temp`
3. Cloudinary processes and stores file
4. Local temp file is deleted
5. Cloudinary URL is saved to database

## 🌐 CORS Configuration

CORS is configured to accept requests from the origin specified in `CORS_ORIGIN` environment variable with credentials enabled.

## 🔐 Security Features

- Password hashing with bcrypt (10 salt rounds)
- HTTP-only cookies for tokens
- Secure cookie flag for production
- JWT-based authentication
- Protected routes with middleware
- Input validation for user data

## 📚 Model Reference

Data model design: [Eraser.io Workspace](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)


## 👨‍💻 Author

**Shubham**

## 📄 License

ISC

---

**Note:** This is a backend API server. For the complete application, integrate with a frontend client.