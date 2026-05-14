# E-Commerce Application

This is a full-stack E-Commerce application with a React Native (Expo) frontend and a Node.js (Express) backend.

## Project Structure
- **frontend/**: React Native mobile application built with Expo.
- **backend/**: Node.js Express server with MySQL database connection.

## Getting Started

### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `.env` file with database credentials and `JWT_SECRET`.
4. Start the server:
   ```bash
   npm start
   ```

### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `.env` file with the `EXPO_PUBLIC_API_URL`.
4. Start the app:
   ```bash
   npm start
   ```

## Security Improvements
- Removed hardcoded fallback for `JWT_SECRET` in the backend.
- Added `.gitignore` files to prevent committing sensitive data like `.env`.
