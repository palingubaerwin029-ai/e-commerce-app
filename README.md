# SwiftCart — E-Commerce Mobile App

A full-stack e-commerce mobile application built with **Expo (React Native)** and **Node.js/Express** with MySQL.

## 📁 Project Structure

```
final-project/
├── frontend/          # Expo (React Native) mobile app
│   ├── app/
│   │   ├── (tabs)/    # Main user tabs (Home, Cart, Profile)
│   │   ├── (auth)/    # Authentication screens (Login, Signup)
│   │   ├── (admin)/   # Admin-only screens (Dashboard, Products, Orders)
│   │   └── ...        # Checkout, Orders, Details
│   ├── context/       # React Context (Auth, Cart, Toast)
│   ├── services/      # API service layer
│   ├── eas.json       # EAS Build configuration
│   └── app.json       # Expo app configuration
│
├── backend/           # Node.js + Express REST API
│   ├── server.js      # Express app with all routes
│   ├── db.js          # MySQL connection pool
│   ├── schema.sql     # Database schema + seed data
│   └── vercel.json    # Vercel deployment configuration
```

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- MySQL Server
- Expo Go app on your phone (for testing)

### 1. Database Setup
```sql
-- Run the schema file in your MySQL client
SOURCE backend/schema.sql;
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env     # Then edit .env with your MySQL credentials
npm run dev              # Starts with nodemon on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env     # Edit API URL if needed
npx expo start           # Scan QR code with Expo Go
```

## ☁️ Deployment

### Backend → Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the backend folder: `cd backend`
3. Run `vercel` and follow the prompts
4. Set environment variables in the Vercel dashboard:
   - `DB_HOST` — your cloud MySQL host
   - `DB_USER` — database username
   - `DB_PASSWORD` — database password
   - `DB_NAME` — `ecommerce_db`
   - `JWT_SECRET` — a strong random secret
5. Deploy to production: `vercel --prod`

> **Note:** You need a cloud-hosted MySQL database (e.g., Railway, PlanetScale, Aiven, or Clever Cloud) since Vercel is serverless.

### Frontend → EAS Build (APK)

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Navigate to frontend folder: `cd frontend`
4. Link to EAS project: `eas init` (this sets the `projectId` in app.json)
5. Update `frontend/.env` with your deployed Vercel backend URL:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend.vercel.app/api
   ```
6. Build an APK for testing:
   ```bash
   eas build --platform android --profile preview
   ```
7. Build a production AAB for Play Store:
   ```bash
   eas build --platform android --profile production
   ```

## 🔑 App Identifier
- **Android Package:** `com.swiftcart.app`
- **iOS Bundle ID:** `com.swiftcart.app`

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get profile |
| GET | `/api/products` | No | List products |
| GET | `/api/products/:id` | No | Product details |
| POST | `/api/products` | Yes | Create product |
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders` | Yes | User's orders |
| GET | `/api/admin/orders` | Yes | All orders (admin) |
| PUT | `/api/admin/orders/:id/status` | Yes | Update order status |
| GET | `/api/health` | No | Health check |
