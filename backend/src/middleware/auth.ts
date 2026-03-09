import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { players } from '../db/schema.js';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, TokenPayload } from '../utils/jwt.js';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

// Auth middleware: verifies access token, auto-refreshes if expired
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    try {
        // Get access token from header
        const authHeader = req.headers.authorization;
        const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!accessToken) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }

        try {
            // Try to verify access token
            const payload = verifyAccessToken(accessToken);
            req.user = payload;
            next();
        } catch (accessError: any) {
            // Access token expired → try refresh token from cookie
            if (accessError.name === 'TokenExpiredError') {
                const refreshToken = req.cookies?.refreshToken;

                if (!refreshToken) {
                    res.status(401).json({ error: 'Access token expired. Please login again.' });
                    return;
                }

                try {
                    // Verify refresh token
                    const refreshPayload = verifyRefreshToken(refreshToken);

                    // Generate new access token
                    const newAccessToken = generateAccessToken({
                        userId: refreshPayload.userId,
                        email: refreshPayload.email,
                        role: refreshPayload.role,
                    });

                    // Send new access token in response header
                    res.setHeader('X-New-Access-Token', newAccessToken);

                    req.user = {
                        userId: refreshPayload.userId,
                        email: refreshPayload.email,
                        role: refreshPayload.role,
                    };
                    next();
                } catch (refreshError) {
                    res.status(401).json({ error: 'Session expired. Please login again.' });
                    return;
                }
            } else {
                res.status(401).json({ error: 'Invalid access token' });
                return;
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Authentication error' });
        return;
    }
}

// Admin-only middleware
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}

// Player-only middleware (or admin)
export function playerOrAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || (req.user.role !== 'player' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    next();
}

/**
 * Midleware: Only allows admins OR the captain of the specific team.
 * Expects team ID in req.params.id or req.params.teamId
 */
export async function captainOrAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Admins can skip captain check
        if (req.user.role === 'admin') {
            return next();
        }

        const teamId = req.params.id || req.params.teamId || req.body.teamId;
        if (!teamId) {
            res.status(400).json({ error: 'Team ID required' });
            return;
        }

        // Check if the user is a captain of this specific team
        const [player] = await db.select({
            isCaptain: players.isCaptain,
            teamId: players.teamId
        })
            .from(players)
            .where(eq(players.userId, req.user.userId))
            .limit(1);

        if (!player || !player.isCaptain || player.teamId !== teamId) {
            res.status(403).json({ error: 'Only the team captain or admin can perform this action' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Authorization error' });
    }
}
