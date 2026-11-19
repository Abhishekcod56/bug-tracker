# MERN Bug Tracker – Issue Tracking System

A full-stack Bug Tracking and Issue Management application built using the MERN stack (MongoDB, Express.js, React.js, and Node.js). This application helps teams create, assign, manage, track, and discuss software bugs and development tasks.

## Features

### Authentication
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Protected application routes

### Project Management
- Create and view projects
- Edit and delete projects
- Add team members to projects
- Project owner and team member access

### Ticket Management
- Create, edit, and delete tickets
- Assign tickets to team members
- Set ticket priority
- Track ticket status
- Search tickets by title
- Filter tickets by status, priority, and assignee

### Kanban Board
- Three ticket statuses:
  - To Do
  - In Progress
  - Done
- Drag and drop tickets between status columns

### Comments
- Add comments to tickets
- View comments with author information and timestamps
- Delete your own comments

### User Profile
- Update profile name
- Change password
- Show or hide password fields

### Responsive Design
- Responsive layout for desktop and mobile devices
- Mobile navigation menu
- Horizontally scrollable Kanban board on smaller screens

## Technologies Used

### Frontend
- React.js – Building the user interface
- Vite – Frontend development and build tool
- Tailwind CSS – Styling and responsive design
- React Router – Client-side routing
- Axios – HTTP requests to the backend API
- Lucide React – Icons

### Backend
- Node.js – JavaScript runtime
- Express.js – REST API development
- MongoDB – NoSQL database
- Mongoose – MongoDB object modeling
- JSON Web Token (JWT) – Authentication
- bcrypt – Password hashing

### Development Tools
- Visual Studio Code
- Git and GitHub
- MongoDB Atlas

## Project Structure

```text
mern-bug-tracker/
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Profile.jsx
│   │   ├── App.jsx
│   │   └── api.js
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── models/
│   │   └── routes/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

## How to Run the Project Locally

### Prerequisites

Install the following:
- Node.js and npm
- MongoDB Atlas account or a local MongoDB database
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd mern-bug-tracker
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `server` folder.

Add the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Replace the example values with your actual MongoDB connection string and a secure JWT secret.

**Important:** Never upload your `.env` file or expose your database credentials or JWT secret publicly.

### 4. Start the Backend

From the `server` folder, run:

```bash
npm run dev
```

The backend API will run on:

```text
http://localhost:5000
```

### 5. Install Frontend Dependencies

Open another terminal and navigate to the client folder:

```bash
cd client
npm install
```

### 6. Start the Frontend

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## Deployment

Deploy the `server` and `client` directories as separate services.

### Backend

Set these environment variables on the backend host:

```text
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<new cryptographically random secret>
CLIENT_URL=<deployed frontend URL>
PORT=<port supplied by the host>
```

`CLIENT_URL` accepts comma-separated origins when staging and production frontend URLs need access.

Use `npm start` as the backend start command. Confirm the deployment with `GET /api/health`.

### Frontend

Set `VITE_API_URL` to the deployed backend API URL, for example:

```text
VITE_API_URL=https://your-api-host.example.com/api
```

Build the frontend with:

```bash
cd client
npm install
npm run build
```

Publish the generated `client/dist` directory. Configure the frontend host to rewrite application routes such as `/login`, `/profile`, `/projects`, and `/tickets` to `index.html`.

## Application Workflow

1. Register a new account or log in.
2. Create a project.
3. Add team members to the project.
4. Create tickets for bugs or tasks.
5. Assign tickets to team members.
6. Set ticket priority and status.
7. Move tickets across the Kanban board.
8. Add comments to discuss issues.
9. Search and filter tickets.
10. Update your profile or password.

## Future Improvements

- Role-based access control
- Screenshot and file attachments for tickets
- Email notifications
- Advanced reporting and analytics
- Automated testing

## Author

Developed as a full-stack web development project using the MERN stack.

## License

This project is available for educational and learning purposes.