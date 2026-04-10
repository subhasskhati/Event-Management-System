# Event Management Web Application

## Project Description
This is a full-stack Event Management Web Application developed as a college project. It allows users to register, login, browse local events, and book them. Admins have the ability to manage events (Add, Edit, Delete).

## Tech Stack
- **Frontend:** Plain HTML, CSS, JavaScript (No frameworks)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Authentication:** JWT (JSON Web Tokens) and Bcrypt for password hashing

## Features
- User Registration and Login
- Secure Authentication with JWT
- Event Management (CRUD operations for Admins)
- Event Booking for Users
- My Bookings View
- Contact Form

## Run Steps
1. Clone the project.
2. Run `npm install` to install backend dependencies.
3. Create a `.env` file in the root and add:
   - `MONGODB_URI` (Your MongoDB connection string)
   - `JWT_SECRET` (Your secret key for JWT)
4. Run `npm start` to start the server.
5. Start Ollama locally with a lightweight model, for example:
   - `ollama pull llama2:latest`
   - `ollama serve`
6. Open `http://localhost:3000` in your browser.

## Ollama configuration
- The app is configured to use `llama2:latest` for AI chat.
- If you set `OLLAMA_MODELS=llama2` in your `.env`, the server will automatically map it to `llama2:latest`.
- If you need to override the host, set `OLLAMA_HOST` in your `.env` file.

## Git Steps
```bash
git init
git add .
git commit -m "event project"
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

## Deployment Steps
1. Set up your environment variables (`MONGODB_URI`, `JWT_SECRET`) on the hosting platform.
2. Ensure the `PORT` is handled by the platform (default is 3000 in code).
3. The server is configured to serve the `public` folder as static files.
