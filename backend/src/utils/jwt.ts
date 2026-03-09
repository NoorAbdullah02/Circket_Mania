import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cricket-mania-super-secret-key-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'cricket-mania-refresh-secret-key-2024';
const JWT_EXPIRES_IN = '15m';        // Access token: 15 minutes
const JWT_REFRESH_EXPIRES_IN = '7d'; // Refresh token: 7 days

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

// Generate access token (short-lived)
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Generate refresh token (long-lived)
export function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

// Verify access token
export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// Verify refresh token
export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}

// Generate activation token (for player email activation)
export function generateActivationToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '48h' });
}

// Verify activation token
export function verifyActivationToken(token: string): { userId: string; email: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
}
