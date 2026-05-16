# E-Commerce App - Frontend

This is the frontend of the E-Commerce application, built with [Expo](https://expo.dev) and React Native.

## Features
- Product browsing.
- Cart management.
- User authentication (JWT).
- Checkout flow.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npm start
   ```

## Configuration
Ensure you have a `.env` file with the correct API URL:
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```
*(Replace `localhost` with your machine's IP if testing on a physical device).*

## Backend
The backend for this project is located in the `backend` directory of the project root. It handles authentication, products, and orders.
