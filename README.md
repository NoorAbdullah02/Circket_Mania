# 🏏 ICE Cricket Mania - Season 2

A premium, full-stack cricket tournament management system designed for campus and community leagues. Features real-time match tracking, dynamic rankings, and a stunning "glassmorphism" aesthetic.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

**Tagline**: *"Where technology strikes the willow."* 🎯

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Available Scripts](#-available-scripts)
- [Demo Credentials](#-demo-credentials)
- [Key Calculations](#-key-calculations)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🎯 Tournament Management
- **Team Management**: Create and manage cricket teams with logos, cover photos, and brand colors
- **Match Scheduling**: Schedule matches with detailed team assignments and venue information
- **Live Scoring**: Real-time ball-by-ball scoring with commentary and stats
- **Score Management**: Track runs, wickets, overs, and match outcomes
- **Tournament Settings**: Configure default overs, points system, and player limits

### 👥 Player Management
- **Player Profiles**: Complete player profiles with stats, roles, and career achievements
- **Player Registration**: Self-service registration system with email verification
- **Draft System**: Assign players to teams with status tracking (pending, selected, activated, rejected)
- **Leaderboards**: Top scorers, bowlers, and fielders with detailed statistics
- **Demo Players**: 12 pre-seeded demo players per team for instant testing

### 📊 Analytics & Insights
- **Live Points Table**: Auto-calculated standings with dynamic NRR rankings
- **Net Run Rate (NRR)**: Automatic calculation based on match performance
- **Player Statistics**: 
  - Batting: Total runs, balls faced, fours, sixes, strike rate
  - Bowling: Total wickets, balls bowled, runs conceded, bowling average
  - Fielding: Catches, run-outs
- **Most Valuable Player**: Series MVP selection based on overall performance
- **Match History**: Detailed match records with scores and results

### 💼 Admin Dashboard
- **Team Analytics**: View team performance, player counts, and tournament standings
- **Match Management**: Create, update, delete, and finalize matches
- **Score Management**: Input and modify match scores in real-time
- **Player Assignment**: Draft players to teams and manage status
- **Reports**: Visual charts and statistics for tournament health

### 👤 User Authentication
- **JWT-based Authentication**: Secure access with access and refresh tokens
- **Email Verification**: Token-based account activation
- **Password Security**: Bcrypt hashing for secure password storage
- **Role-based Access**: Admin and Player roles with appropriate permissions

### 📱 Responsive Design
- **Mobile-first Approach**: Optimized for all screen sizes
- **Glassmorphism UI**: Modern, semi-transparent card designs
- **Smooth Animations**: Framer Motion and GSAP animations
- **Dark Theme**: Eye-friendly dark background with vibrant accent colors

---

## 🚀 Tech Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Tailwind CSS** | Styling Engine | 4.0 |
| **Vite** | Build Tool | 7.x |
| **TanStack Query** | Data Fetching | 5.x |
| **Framer Motion** | Animations | Latest |
| **GSAP** | Advanced Animations | Latest |
| **Zustand** | State Management | Latest |
| **Lucide React** | Icon Library | Latest |
| **React Hot Toast** | Notifications | Latest |
| **Recharts** | Data Visualization | Latest |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js** | Runtime | 20+ |
| **Express.js** | Web Server | 5.x |
| **TypeScript** | Type Safety | 5.x |
| **PostgreSQL** | Database | 14+ |
| **Drizzle ORM** | Database ORM | Latest |
| **JWT** | Authentication | jsonwebtoken |
| **Bcryptjs** | Password Hashing | 2.4.x |
| **Zod** | Schema Validation | Latest |
| **Cloudinary** | Image Hosting | Latest |
| **CORS** | Cross-Origin Support | Latest |

---

## 📁 Project Structure

```
Circket_Mania/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   ├── players.ts     # Player CRUD & stats
│   │   │   ├── teams.ts       # Team management
│   │   │   ├── matches.ts     # Match scoring & outcomes
│   │   │   └── upload.ts      # File upload handling
│   │   ├── db/
│   │   │   ├── index.ts       # Database connection
│   │   │   ├── schema.ts      # Drizzle schema definition
│   │   │   └── seed.ts        # Database seeding
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT verification
│   │   ├── routes/            # Express route definitions
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── services/          # Business logic
│   │   │   ├── cloudinary.ts # Image upload service
│   │   │   └── email.ts      # Email notifications
│   │   └── index.ts          # Server entry point
│   ├── drizzle/              # Migration files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── TeamDetails.tsx
│   │   │   ├── Matches.tsx
│   │   │   ├── MatchDetails.tsx
│   │   │   ├── PointsTable.tsx
│   │   │   ├── PlayerProfile.tsx
│   │   │   ├── PlayerDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ActivateAccount.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.tsx
│   │   │   └── ui/           # Reusable UI components
│   │   ├── api/
│   │   │   └── client.ts     # Axios API instance
│   │   ├── store/
│   │   │   └── useAuthStore.ts # Zustand auth state
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css         # Global styles
│   └── package.json
│
└── README.md
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js**: Version 20.0.0 or higher
- **npm/yarn**: Package manager
- **PostgreSQL**: Database (14+ recommended)
- **Cloudinary Account**: For image storage (optional, for file uploads)
- **Git**: Version control

### Step 1: Clone Repository

```bash
git clone https://github.com/NoorAbdullah02/Circket_Mania.git
cd Circket_Mania
```

### Step 2: Environment Configuration

Create `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgres://username:password@localhost:5432/cricket_mania

# JWT Secrets (Use strong, random strings)
JWT_SECRET=your_super_secret_jwt_key_here
REFRESH_SECRET=your_super_secret_refresh_key_here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Email (optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Create `.env` file in the `frontend/` directory (if needed):

```env
VITE_API_URL=http://localhost:4000/api
```

### Step 3: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

### Step 4: Database Setup

```bash
# From backend directory
cd backend

# Push schema to PostgreSQL
npm run db:push

# Seed default admin users
npm run seed

cd ..
```

### Step 5: Build & Start

```bash
# Build both frontend and backend
npm run build

# Start the production server
npm start
```

**Frontend**: http://localhost:5173  
**Backend API**: http://localhost:4000/api

---

## 🔐 Environment Variables

### Backend Environment Variables

```env
# Server
PORT=4000                              # Server port
NODE_ENV=development|production        # Environment

# Database
DATABASE_URL=postgres://...            # PostgreSQL connection string

# Authentication
JWT_SECRET=<strong-random-string>      # JWT signing secret (min 32 chars)
REFRESH_SECRET=<strong-random-string>  # Refresh token secret (min 32 chars)

# File Upload
CLOUDINARY_CLOUD_NAME=your_name        # Cloudinary account name
CLOUDINARY_API_KEY=your_key            # Cloudinary API key
CLOUDINARY_API_SECRET=your_secret      # Cloudinary API secret

# CORS
FRONTEND_URL=http://localhost:5173     # Frontend origin
```

### Generate Strong Secrets

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Database Schema

### Core Tables

#### Users
Stores user accounts with authentication details.
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255)
- email: VARCHAR(255) UNIQUE
- password: TEXT (bcrypt hashed)
- role: ENUM('admin', 'player')
- activationToken: TEXT (nullable)
- isActive: BOOLEAN
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### Teams
Cricket teams participating in tournament.
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255) UNIQUE
- logo: TEXT (image URL)
- coverPhoto: TEXT (image URL)
- shortName: VARCHAR(10)
- color: VARCHAR(7) (hex color)
- createdAt: TIMESTAMP
```

#### Players
Player profiles and statistics.
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key → Users)
- batch: VARCHAR(10)
- teamId: UUID (Foreign Key → Teams, nullable)
- profileImage: TEXT (image URL)
- bio: TEXT
- isCaptain: BOOLEAN
- status: ENUM('pending', 'selected', 'activated', 'rejected')
- jerseyNumber: INTEGER
- role: VARCHAR(50) ('Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper')
- totalRuns: INTEGER
- totalWickets: INTEGER
- matchesPlayed: INTEGER
- totalBallsFaced: INTEGER
- totalBallsBowled: INTEGER
- totalRunsConceded: INTEGER
- totalSixes: INTEGER
- totalFours: INTEGER
- totalCatches: INTEGER
- teamToken: VARCHAR(255) (nullable)
- createdAt: TIMESTAMP
```

#### Matches
Match details and metadata.
```sql
- id: UUID (Primary Key)
- teamAId: UUID (Foreign Key → Teams)
- teamBId: UUID (Foreign Key → Teams)
- overs: INTEGER
- date: VARCHAR(20)
- time: VARCHAR(20)
- venue: VARCHAR(255)
- status: ENUM('upcoming', 'live', 'completed', 'cancelled', 'no_result', 'postponed')
- tossWinner: UUID (Foreign Key → Teams, nullable)
- tossDecision: VARCHAR(10) ('bat', 'bowl')
- winnerTeamId: UUID (Foreign Key → Teams, nullable)
- manOfTheMatch: UUID (Foreign Key → Players, nullable)
- matchType: VARCHAR(20) ('league', 'final')
- scoreboardImage: TEXT (image URL)
- createdAt: TIMESTAMP
```

#### Scores
Match scores for each inning.
```sql
- id: UUID (Primary Key)
- matchId: UUID (Foreign Key → Matches)
- teamARuns: INTEGER
- teamBRuns: INTEGER
- teamAWickets: INTEGER
- teamBWickets: INTEGER
- teamAOversPlayed: REAL
- teamBOversPlayed: REAL
- teamAExtras: INTEGER
- teamBExtras: INTEGER
- currentInnings: INTEGER
- updatedAt: TIMESTAMP
```

#### Points Table
Auto-calculated tournament standings.
```sql
- id: UUID (Primary Key)
- teamId: UUID (Foreign Key → Teams)
- matchesPlayed: INTEGER
- wins: INTEGER
- losses: INTEGER
- points: INTEGER
- nrr: REAL (Net Run Rate)
- createdAt: TIMESTAMP
```

#### Tournament Settings
Global tournament configuration.
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255)
- defaultOvers: INTEGER
- matchesPerTeam: INTEGER
- pointsPerWin: INTEGER
- pointsPerLoss: INTEGER
- pointsPerNoResult: INTEGER
- playersPerTeam: INTEGER
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

Response: { userId, activationToken, message }
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

Response: { accessToken, refreshToken, user }
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <refresh_token>

Response: { accessToken, refreshToken }
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>

Response: { message: "Logged out successfully" }
```

### Team Endpoints

#### Get All Teams
```http
GET /api/teams

Response: [{ id, name, logo, color, players: [] }, ...]
```

#### Get Team Details
```http
GET /api/teams/:teamId

Response: {
  id,
  name,
  shortName,
  logo,
  coverPhoto,
  color,
  players: [{ id, name, role, jerseyNumber, isCaptain }, ...],
  upcomingMatches: [{ id, opponent, date, venue }, ...]
}
```

#### Create Team (Admin)
```http
POST /api/teams
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "BYTE WARRIOR",
  "shortName": "BW",
  "color": "#38bdf8",
  "logo": "https://...",
  "coverPhoto": "https://..."
}

Response: { id, name, ... }
```

### Player Endpoints

#### Get Player Profile
```http
GET /api/players/:playerId

Response: {
  id,
  name,
  email,
  role,
  batch,
  teamId,
  stats: {
    totalRuns,
    totalWickets,
    totalCatches,
    matchesPlayed,
    ...
  },
  profileImage
}
```

#### Get Leaderboard
```http
GET /api/players/leaderboard?type=batsmen|bowlers|fielders

Response: [
  {
    rank,
    name,
    value,
    team,
    profileImage
  },
  ...
]
```

#### Get Series MVP
```http
GET /api/players/series-mvp

Response: {
  id,
  name,
  team,
  totalPoints,
  stats: { ... }
}
```

### Match Endpoints

#### Get All Matches
```http
GET /api/matches?status=upcoming|live|completed

Response: [
  {
    id,
    teamA: { id, name, logo },
    teamB: { id, name, logo },
    date,
    time,
    venue,
    status
  },
  ...
]
```

#### Get Match Details
```http
GET /api/matches/:matchId

Response: {
  id,
  teamA,
  teamB,
  date,
  time,
  venue,
  scores: {
    teamARuns,
    teamBRuns,
    teamAWickets,
    teamBWickets,
    ...
  },
  result,
  manOfTheMatch
}
```

#### Update Match Score (Admin)
```http
PATCH /api/matches/:matchId/score
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "teamARuns": 145,
  "teamAWickets": 7,
  "teamAOvers": "19.5",
  "teamBRuns": 148,
  "teamBWickets": 3,
  "teamBOvers": "18.2"
}
```

### Points Table Endpoints

#### Get Points Table
```http
GET /api/matches/points-table

Response: [
  {
    rank,
    teamName,
    matchesPlayed,
    wins,
    losses,
    points,
    nrr,
    logo
  },
  ...
]
```

---

## 📊 Key Calculations

### Net Run Rate (NRR)

**Formula**:
```
NRR = (Total Runs Scored / Total Overs Played) - (Total Runs Conceded / Total Overs Bowled)
```

**Example**:
- Team scored 500 runs in 50 overs → Scoring Rate = 10.0
- Team conceded 450 runs in 50 overs → Conceding Rate = 9.0
- NRR = 10.0 - 9.0 = **+1.0**

**Current Implementation**: Auto-calculated by backend when match status changes to "completed"

### Points System

| Result | Points |
|--------|--------|
| Win | 2 |
| Loss | 0 |
| No Result / Tie | 1 |
| Bonus (4+ wickets win) | +0.5* |

*Optional bonus system (configurable)

### Ranking

Teams ranked by:
1. **Total Points** (Primary)
2. **Net Run Rate** (Tiebreaker)
3. **Head-to-Head** (if available)

---

## 📜 Available Scripts

### Root Directory

```bash
# Full build for production
npm run build

# Start production server
npm start

# Development mode (both frontend + backend)
npm run dev

# Build only
npm run build:all
```

### Backend Directory

```bash
npm run dev              # Start in watch mode (development)
npm run build            # Compile TypeScript to JavaScript
npm run db:push          # Sync schema changes to database
npm run db:studio        # Launch Drizzle Studio (GUI)
npm run seed             # Seed default admin users
npm run start            # Start production server
```

### Frontend Directory

```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

---

## 👤 Demo Credentials

### Admin Accounts

| Email | Password | Role |
|-------|----------|------|
| admin1@noor.com | NoorAbdullah | Admin |
| admin2@noor.com | NoorAbdullah1 | Admin |

### Demo Players

- **Teams**: BYTE WARRIOR, LEGACY FIFTEEN, CODE CRUSHERS, CYBER STRIKERS
- **Players per Team**: 12 demo players
- **Email Format**: `player{number}_{randomId}.{teamname}@cricket.com`
- **Password**: `Cricket@2024`
- **Status**: All activated and ready to use

---

## 🌐 Deployment

### Render.com Deployment

The project includes a build configuration for Render hosting:

```yaml
build:
  command: npm run build
```

**Deployment Steps**:

1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Render will auto-build and deploy

**Set these environment variables on Render**:
- `DATABASE_URL`
- `JWT_SECRET`
- `REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Vercel Deployment (Frontend only)

The frontend can be deployed separately to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
# Mac: brew services list | grep postgres
# Linux: sudo service postgresql status

# Test connection
psql -U username -d cricket_mania -h localhost
```

### Port Already in Use

```bash
# Kill process on port 4000
# Mac: lsof -ti:4000 | xargs kill -9
# Linux: fuser -k 4000/tcp
# Windows: netstat -ano | findstr :4000
```

### Seed Fails

```bash
# Reset and reseed database
cd backend
npm run db:push
npm run seed
```

### Frontend Build Issues

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### API Connection Issues

- Verify `FRONTEND_URL` in backend `.env`
- Check CORS settings in `backend/src/index.ts`
- Ensure backend is running on correct port
- Check API client configuration in `frontend/src/api/client.ts`

---

## 📝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Noor Abdullah**
- GitHub: [@NoorAbdullah02](https://github.com/NoorAbdullah02)
- Email: noor@example.com

---

## 🙏 Acknowledgments

- Built with ❤️ for the college cricket community
- Inspired by professional cricket management systems
- Thanks to all contributors and testers

---

## 📞 Support

For issues, feature requests, or questions:

- Create an Issue on GitHub
- Contact: support@cricketmania.com
- Discord: [Join Server](https://discord.gg/cricketmania)

---

**Last Updated**: March 12, 2026  
**Version**: 2.0.0  
**Status**: Production Ready ✅
