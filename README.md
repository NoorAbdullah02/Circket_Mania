# 🏏 ICE Cricket Mania

A premium, full-stack cricket tournament management system designed for campus and community leagues. Built with a modern, high-performance tech stack and a stunning "glassmorphism" aesthetic.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## ✨ Core Features

### 👔 Admin Dashboard
- **Franchise Management**: Create teams, upload logos, and set brand colors.
- **Draft System**: Assign players to teams with real-time status updates.
- **Match Control**: Create, update, and finalize matches.
- **Scoring Engine**: Detailed ball-by-ball commentary and inning-wise score tracking.
- **Seed System**: Auto-generation of default administration accounts.

### 🎖️ Player Experience
- **Personal Dashboard**: Manage profile details, batting/bowling styles, and bios.
- **Captain's Suite**: Team captains can manage their franchise details and view their full squad.
- **Email Verification**: Secure token-based profile activation system.

### 📊 Tournament Insights
- **Live Match Tracking**: Real-time status for Live, Upcoming, and Completed matches.
- **Dynamic Points Table**: Auto-calculated standings based on points and Net Run Rate (NRR).
- **Player Leaderboard**: Track top performers (Runs, Wickets, Boundaries).
- **Interactive Stats**: Detailed career and match-specific statistics for every player.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS 4.0 (Modern Engine)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v20+)
- **Server**: Express.js (v5.x)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT (Access + Refresh Tokens)
- **File Storage**: Cloudinary (Image uploads)
- **Validation**: Zod (Schema-based)

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (>= 20.0.0)
- PostgreSQL Database
- Cloudinary Account (for image uploads)

### 1. Clone the repository
```bash
git clone https://github.com/NoorAbdullah02/Circket_Mania.git
cd Cricket-Mania
```

### 2. Configure Environment
Create a `.env` file in the `backend/` directory:
```env
PORT=4000
DATABASE_URL=postgres://user:password@localhost:5432/cricket_mania
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

### 3. Build & Start
From the root directory:
```bash
# Install dependencies, build frontend & backend
npm run build

# Push schema, seed data, and start production server
npm start
```

---

## 📖 Available Scripts

### Root Directory
- `npm run build`: Full build sequence for both frontend and backend.
- `npm start`: Production startup (Syncs DB, Seeds Admin, Starts Server).

### Backend Directory
- `npm run dev`: Start backend in watch mode with `tsx`.
- `npm run db:push`: Push local schema changes to the database.
- `npm run db:studio`: Launch Drizzle Studio to manage data visually.
- `npm run seed`: Reset and seed original admin users.

### Frontend Directory
- `npm run dev`: Start Vite development server.
- `npm run build`: Build optimized production bundle.

---

## 🎨 Design Philosophy
The application follows a **Glassmorphism** design language, featuring:
- Semi-transparent "frost" panels.
- Vibrant primary colors (Brand Red, Blue, Yellow).
- Optimized mobile-first navigation with smooth motion transitions.
- High contrast, dark-themed interface for a premium feel.

---

## 📜 License
This project is licensed under the ISC License.

---
*Created by **Noor Abdullah** & Team for the ICE Community.*
