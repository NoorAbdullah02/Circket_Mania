import { Request, Response, NextFunction } from 'express';
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
