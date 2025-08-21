# Task Manager - Full Stack Application

A complete task management application built with React, Node.js, Express, and PostgreSQL.

## Features

- ✅ User Authentication (Register/Login)
- ✅ Create, Read, Update, Delete Tasks
- ✅ Task Categories and Priority Levels
- ✅ Task Status Management (Pending, In Progress, Completed)
- ✅ User Dashboard with Statistics
- ✅ Responsive Design
- ✅ JWT Authentication
- ✅ Input Validation
- ✅ Error Handling

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing
- Input validation with Joi

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- React Hook Form for form handling

## Project Structure

```
task-manager-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   ├── package.json
│   └── public/
└── database/
    └── schema.sql
```

## Quick Start

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb taskmanager

# Run the schema
psql taskmanager < database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

The application will be running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Tasks
- GET /api/tasks - Get all tasks for authenticated user
- POST /api/tasks - Create new task
- PUT /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task
- GET /api/tasks/stats - Get task statistics

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile

## Environment Variables

Create `.env` file in backend directory:

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskmanager
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## Default Users

After running the schema, you can use these test accounts:
- Email: admin@example.com, Password: admin123
- Email: user@example.com, Password: user123

## Ready for Deployment

This application is ready for deployment on AWS with:
- Environment variable configuration
- Production-ready error handling
- Security middleware
- Database connection pooling
- CORS configuration
- Input validation and sanitization
