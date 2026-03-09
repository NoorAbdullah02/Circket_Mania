import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, players } from '../db/schema.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateActivationToken, verifyActivationToken } from '../utils/jwt.js';
import { registerSchema, loginSchema, activateAccountSchema } from '../schemas/validation.js';

// POST /auth/register — Students register freely (no token needed)
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { name, email, batch, phone, profileImage, role } = parsed.data;

        // Check if email already exists
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        // Create user (no password yet — they set it after admin selects them)
        const [newUser] = await db.insert(users).values({
            name,
            email,
            role: 'player',
            isActive: false,
        }).returning();

        // Create player profile
        await db.insert(players).values({
            userId: newUser.id,
            batch,
            profileImage: profileImage || null,
            role: role || 'Batsman',
            status: 'pending',
        });

        res.status(201).json({
            message: 'Registration successful! Please wait for admin to select you for a team.',
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
        });
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}

// POST /auth/login — Login with email + password
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { email, password } = parsed.data;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        if (!user.password) {
            res.status(401).json({ error: 'Account not activated. Please check your email for the activation link.' });
            return;
        }

        if (!user.isActive) {
            res.status(401).json({ error: 'Account not activated yet.' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Generate tokens
        const tokenPayload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        // Get player info if exists
        let playerInfo = null;
        if (user.role === 'player') {
            const [player] = await db.select().from(players).where(eq(players.userId, user.id)).limit(1);
            playerInfo = player || null;
        }

        res.json({
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            player: playerInfo,
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

// POST /auth/activate — Player activates account and sets password
export async function activateAccount(req: Request, res: Response): Promise<void> {
    try {
        const parsed = activateAccountSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { token, password } = parsed.data;

        // Verify activation token
        let payload;
        try {
            payload = verifyActivationToken(token);
        } catch {
            res.status(400).json({ error: 'Invalid or expired activation link. Please contact admin.' });
            return;
        }

        // Get user
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.isActive) {
            res.status(400).json({ error: 'Account already activated' });
            return;
        }

        // Hash password and activate
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.update(users)
            .set({ password: hashedPassword, isActive: true, activationToken: null })
            .where(eq(users.id, payload.userId));

        res.json({ message: 'Account activated successfully! You can now login and enter your team token.' });
    } catch (error: any) {
        console.error('Activation error:', error);
        res.status(500).json({ error: 'Activation failed' });
    }
}

// POST /auth/refresh — Refresh access token
export async function refreshAccessToken(req: Request, res: Response): Promise<void> {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ error: 'No refresh token found' });
            return;
        }

        const payload = verifyRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken({
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token. Please login again.' });
    }
}

// GET /auth/me — Get current user info
export async function getMe(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const [user] = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let playerInfo = null;
        if (user.role === 'player') {
            const [player] = await db.select().from(players).where(eq(players.userId, user.id)).limit(1);
            playerInfo = player || null;
        }

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            player: playerInfo,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user info' });
    }
}

// POST /auth/logout — Clear refresh token cookie
export async function logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out successfully' });
}
