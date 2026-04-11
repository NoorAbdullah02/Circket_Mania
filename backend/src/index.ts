import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { seedAdmins } from './utils/seed.js';

// Ensure default admins exist
seedAdmins().then(() => console.log('✅ Admin seeding check complete'));

import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import playerRoutes from './routes/players.js';
import matchRoutes from './routes/matches.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

console.log(`🔧 Running in ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// CORS configuration
const corsOrigins = IS_PRODUCTION
    ? [process.env.FRONTEND_URL || 'http://localhost:5173']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

console.log(`✅ Allowed CORS Origins: ${corsOrigins.join(', ')}`);

app.use(cors({
    origin: (origin, callback) => {
        // Log the origin for debugging
        console.log(`📍 CORS Check - Origin: ${origin || 'no origin'}`);

        if (!origin) return callback(null, true); // Allow requests without origin
        if (corsOrigins.includes(origin) || !IS_PRODUCTION) {
            callback(null, true); // Allow in dev mode or if origin matches
        } else {
            console.error(`❌ CORS Blocked: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSP header - allow connections to localhost and same origin
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; connect-src 'self' http://localhost:* https://*.cloudinary.com https://*.neon.tech; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    );
    next();
});

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


/// For frontend and backend in one link

const __dirname = path.resolve();
const distPath = path.join(__dirname, "../frontend/dist");

// Serve static files from dist
app.use(express.static(distPath, {
    maxAge: IS_PRODUCTION ? '1h' : 0,
    etag: !IS_PRODUCTION
}));

// SPA fallback - serve index.html for any route not matched by API or static files
app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});


app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🏏 ICE Cricket Mania Server running on port ${PORT}`);
});

export default app;
