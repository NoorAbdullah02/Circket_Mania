import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    batch: z.string().min(1, 'Batch is required'),
    role: z.string().min(1, 'Player role is required'),
    phone: z.string().optional(),
    profileImage: z.string().min(1, 'Profile image is required'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export const activateAccountSchema = z.object({
    token: z.string().min(1, 'Activation token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Team schemas
export const createTeamSchema = z.object({
    name: z.string().min(7, 'Team name must be at least 7 characters'),
    shortName: z.string().max(10).optional(),
    color: z.string().optional(),
    logo: z.string().optional(),
});

export const assignPlayersSchema = z.object({
    playerIds: z.array(z.string().uuid()).min(1, 'At least one player is required'),
    teamId: z.string().uuid('Invalid team ID'),
});

export const setCaptainSchema = z.object({
    playerId: z.string().uuid('Invalid player ID'),
    teamId: z.string().uuid('Invalid team ID'),
});

// Match schemas
export const createMatchSchema = z.object({
    teamAId: z.string().uuid('Invalid team A ID'),
    teamBId: z.string().uuid('Invalid team B ID'),
    overs: z.number().int().min(1).max(50),
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
    venue: z.string().min(1, 'Venue is required'),
    matchType: z.enum(['league', 'final']).optional(),
});

export const updateMatchSchema = z.object({
    teamAId: z.string().uuid().optional(),
    teamBId: z.string().uuid().optional(),
    overs: z.number().int().min(1).max(50).optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    venue: z.string().optional(),
    status: z.enum(['upcoming', 'live', 'completed', 'cancelled', 'no_result', 'postponed']).optional(),
    matchType: z.enum(['league', 'final']).optional(),
    scoreboardImage: z.string().optional(),
});

// Score update schema
export const updateScoreSchema = z.object({
    teamARuns: z.number().int().min(0).optional(),
    teamBRuns: z.number().int().min(0).optional(),
    teamAWickets: z.number().int().min(0).max(10).optional(),
    teamBWickets: z.number().int().min(0).max(10).optional(),
    teamAOversPlayed: z.number().min(0).optional(),
    teamBOversPlayed: z.number().min(0).optional(),
    teamAExtras: z.number().int().min(0).optional(),
    teamBExtras: z.number().int().min(0).optional(),
    currentInnings: z.number().int().min(1).max(2).optional(),
});

// Player profile update
export const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    bio: z.string().optional(),
    profileImage: z.string().optional(),
    jerseyNumber: z.number().int().optional(),
    role: z.string().optional(),
});

// Auto-generate matches schema
export const autoGenerateMatchesSchema = z.object({
    matchesPerTeam: z.number().int().min(1).max(20),
    defaultOvers: z.number().int().min(1).max(50),
    venue: z.string().min(1),
    startDate: z.string().min(1),
    startTime: z.string().min(1),
});

// Tournament settings
export const updateSettingsSchema = z.object({
    name: z.string().optional(),
    defaultOvers: z.number().int().min(1).max(50).optional(),
    matchesPerTeam: z.number().int().min(1).max(20).optional(),
    pointsPerWin: z.number().int().min(0).optional(),
    pointsPerLoss: z.number().int().min(0).optional(),
    pointsPerNoResult: z.number().int().min(0).optional(),
    playersPerTeam: z.number().int().min(1).optional(),
});

// Commentary
export const addCommentarySchema = z.object({
    matchId: z.string().uuid(),
    over: z.number().min(0),
    ball: z.number().int().min(1).max(6),
    runs: z.number().int().min(0),
    isWicket: z.boolean().optional(),
    isFour: z.boolean().optional(),
    isSix: z.boolean().optional(),
    isExtra: z.boolean().optional(),
    extraType: z.string().optional(),
    description: z.string().optional(),
    innings: z.number().int().min(1).max(2).optional(),
});

// Bulk action schemas
export const bulkSelectPlayersSchema = z.object({
    playerIds: z.array(z.string().uuid()).min(1),
    action: z.enum(['assign_team', 'send_email', 'delete', 'select', 'reject']),
    teamId: z.string().uuid().optional(),
});
