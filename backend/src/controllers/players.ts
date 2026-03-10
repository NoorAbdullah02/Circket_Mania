import { Request, Response } from 'express';
import { eq, like, or, and, ilike, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, players, teams } from '../db/schema.js';
import { updateProfileSchema, bulkSelectPlayersSchema } from '../schemas/validation.js';
import { sendEmail, playerSelectedEmail, captainSelectedEmail } from '../services/email.js';
import { generateActivationToken } from '../utils/jwt.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export async function getAllPlayers(req: Request, res: Response): Promise<void> {
    try {
        const { search, batch, status, teamId } = req.query;

        let query = db
            .select({
                id: players.id,
                userId: players.userId,
                name: users.name,
                email: users.email,
                batch: players.batch,
                teamId: players.teamId,
                profileImage: players.profileImage,
                bio: players.bio,
                isCaptain: players.isCaptain,
                userRole: users.role,
                status: players.status,
                jerseyNumber: players.jerseyNumber,
                role: players.role,
                totalRuns: players.totalRuns,
                totalWickets: players.totalWickets,
                matchesPlayed: players.matchesPlayed,
                totalSixes: players.totalSixes,
                totalFours: players.totalFours,
                totalCatches: players.totalCatches, teamToken: players.teamToken,
                totalBallsFaced: players.totalBallsFaced,
                totalBallsBowled: players.totalBallsBowled,
                totalRunsConceded: players.totalRunsConceded,
                createdAt: players.createdAt,
            })
            .from(players)
            .innerJoin(users, eq(players.userId, users.id));

        const conditions: any[] = [];

        if (search) {
            conditions.push(
                or(
                    ilike(users.name, `%${search}%`),
                    ilike(users.email, `%${search}%`)
                )
            );
        }
        if (batch) {
            conditions.push(eq(players.batch, batch as string));
        }
        if (status) {
            conditions.push(eq(players.status, status as any));
        }
        if (teamId) {
            conditions.push(eq(players.teamId, teamId as string));
        }

        let result;
        if (conditions.length > 0) {
            result = await query.where(and(...conditions));
        } else {
            result = await query;
        }

        res.json(result);
    } catch (error) {
        console.error('Get players error:', error);
        res.status(500).json({ error: 'Failed to get players' });
    }
}

export async function getPlayerById(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;

        const [player] = await db
            .select({
                id: players.id,
                userId: players.userId,
                name: users.name,
                email: users.email,
                batch: players.batch,
                teamId: players.teamId,
                profileImage: players.profileImage,
                bio: players.bio,
                isCaptain: players.isCaptain,
                status: players.status,
                jerseyNumber: players.jerseyNumber,
                role: players.role,
                totalRuns: players.totalRuns,
                totalWickets: players.totalWickets,
                matchesPlayed: players.matchesPlayed,
                totalSixes: players.totalSixes,
                totalFours: players.totalFours,
                totalCatches: players.totalCatches, teamToken: players.teamToken,
                totalBallsFaced: players.totalBallsFaced,
                totalBallsBowled: players.totalBallsBowled,
                totalRunsConceded: players.totalRunsConceded,
            })
            .from(players)
            .innerJoin(users, eq(players.userId, users.id))
            .where(eq(players.id, id))
            .limit(1);

        if (!player) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }

        let teamInfo = null;
        if (player.teamId) {
            const [team] = await db.select({
                id: teams.id,
                name: teams.name,
                logo: teams.logo,
                shortName: teams.shortName,
                color: teams.color,
                createdAt: teams.createdAt,
            }).from(teams).where(eq(teams.id, player.teamId)).limit(1);
            teamInfo = team;
        }

        res.json({ ...player, team: teamInfo });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get player' });
    }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { name, bio, profileImage, jerseyNumber, role } = parsed.data;

        const [player] = await db.select().from(players).where(eq(players.userId, req.user.userId)).limit(1);
        if (!player) {
            res.status(404).json({ error: 'Player profile not found' });
            return;
        }

        if (name) {
            await db.update(users).set({ name }).where(eq(users.id, req.user.userId));
        }

        await db.update(players).set({
            ...(bio !== undefined && { bio }),
            ...(profileImage !== undefined && { profileImage }),
            ...(jerseyNumber !== undefined && { jerseyNumber }),
            ...(role !== undefined && { role }),
        }).where(eq(players.userId, req.user.userId));

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
}

export async function adminUpdatePlayer(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const updates = req.body;

        const [player] = await db.select({
            id: players.id,
            userId: players.userId,
            batch: players.batch,
            teamId: players.teamId,
            profileImage: players.profileImage,
            bio: players.bio,
            isCaptain: players.isCaptain,
            status: players.status,
            jerseyNumber: players.jerseyNumber,
            role: players.role,
            totalRuns: players.totalRuns,
            totalWickets: players.totalWickets,
            matchesPlayed: players.matchesPlayed,
            totalBallsFaced: players.totalBallsFaced,
            totalBallsBowled: players.totalBallsBowled,
            totalRunsConceded: players.totalRunsConceded,
            totalSixes: players.totalSixes,
            totalFours: players.totalFours,
            totalCatches: players.totalCatches, teamToken: players.teamToken,
            createdAt: players.createdAt,
        }).from(players).where(eq(players.id, id)).limit(1);
        if (!player) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }

        const userUpdates: any = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.isAdmin !== undefined) userUpdates.role = updates.isAdmin ? 'admin' : 'player';
        if (updates.userRole !== undefined) userUpdates.role = updates.userRole;

        if (Object.keys(userUpdates).length > 0) {
            await db.update(users).set(userUpdates).where(eq(users.id, player.userId));
        }

        const playerUpdates: any = {};
        if (updates.batch) playerUpdates.batch = updates.batch;
        if (updates.bio !== undefined) playerUpdates.bio = updates.bio;
        if (updates.profileImage !== undefined) playerUpdates.profileImage = updates.profileImage;
        if (updates.jerseyNumber !== undefined) playerUpdates.jerseyNumber = updates.jerseyNumber;
        if (updates.role !== undefined) playerUpdates.role = updates.role;
        if (updates.status) playerUpdates.status = updates.status;
        if (updates.teamId !== undefined) playerUpdates.teamId = updates.teamId;
        if (updates.isCaptain !== undefined) playerUpdates.isCaptain = updates.isCaptain;
        if (updates.totalRuns !== undefined) playerUpdates.totalRuns = updates.totalRuns;
        if (updates.totalWickets !== undefined) playerUpdates.totalWickets = updates.totalWickets;
        if (updates.matchesPlayed !== undefined) playerUpdates.matchesPlayed = updates.matchesPlayed;
        if (updates.totalSixes !== undefined) playerUpdates.totalSixes = updates.totalSixes;
        if (updates.totalFours !== undefined) playerUpdates.totalFours = updates.totalFours;
        if (updates.totalCatches !== undefined) playerUpdates.totalCatches = updates.totalCatches;
        if (updates.totalBallsFaced !== undefined) playerUpdates.totalBallsFaced = updates.totalBallsFaced;
        if (updates.totalBallsBowled !== undefined) playerUpdates.totalBallsBowled = updates.totalBallsBowled;
        if (updates.totalRunsConceded !== undefined) playerUpdates.totalRunsConceded = updates.totalRunsConceded;

        if (Object.keys(playerUpdates).length > 0) {
            await db.update(players).set(playerUpdates).where(eq(players.id, id));

            // If player became captain, send email
            if (updates.isCaptain === true && player.isCaptain === false) {
                const [user] = await db.select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    password: users.password,
                    role: users.role,
                    activationToken: users.activationToken,
                    isActive: users.isActive,
                    createdAt: users.createdAt,
                    updatedAt: users.updatedAt,
                }).from(users).where(eq(users.id, player.userId)).limit(1);
                if (user && player.teamId) {
                    const [team] = await db.select({
                        id: teams.id,
                        name: teams.name,
                        logo: teams.logo,
                        shortName: teams.shortName,
                        color: teams.color,
                        createdAt: teams.createdAt,
                    }).from(teams).where(eq(teams.id, player.teamId)).limit(1);
                    if (team) {
                        const emailData = captainSelectedEmail(user.name, team.name);
                        emailData.to = user.email;
                        await sendEmail(emailData);
                    }
                }
            }
        }

        res.json({ message: 'Player updated successfully' });
    } catch (error) {
        console.error('Error updating player (admin):', error);
        res.status(500).json({ error: 'Failed to update player' });
    }
}

export async function deletePlayer(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;

        const [player] = await db.select({
            id: players.id,
            userId: players.userId,
            batch: players.batch,
            teamId: players.teamId,
            profileImage: players.profileImage,
            bio: players.bio,
            isCaptain: players.isCaptain,
            status: players.status,
            jerseyNumber: players.jerseyNumber,
            role: players.role,
            totalRuns: players.totalRuns,
            totalWickets: players.totalWickets,
            matchesPlayed: players.matchesPlayed,
            totalBallsFaced: players.totalBallsFaced,
            totalBallsBowled: players.totalBallsBowled,
            totalRunsConceded: players.totalRunsConceded,
            totalSixes: players.totalSixes,
            totalFours: players.totalFours,
            totalCatches: players.totalCatches, teamToken: players.teamToken,
            createdAt: players.createdAt,
        }).from(players).where(eq(players.id, id)).limit(1);
        if (!player) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }

        await db.delete(players).where(eq(players.id, id));
        await db.delete(users).where(eq(users.id, player.userId));

        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete player' });
    }
}

export async function bulkAction(req: Request, res: Response): Promise<void> {
    try {
        const parsed = bulkSelectPlayersSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { playerIds, action, teamId } = parsed.data;

        switch (action) {
            case 'assign_team': {
                console.log(`📌 Starting assign_team action for ${playerIds.length} player(s) to team ${teamId}`);
                if (!teamId) {
                    res.status(400).json({ error: 'Team ID required for assignment' });
                    return;
                }
                const [team] = await db.select({
                    id: teams.id,
                    name: teams.name,
                    logo: teams.logo,
                    shortName: teams.shortName,
                    color: teams.color,
                    createdAt: teams.createdAt,
                }).from(teams).where(eq(teams.id, teamId)).limit(1);
                if (!team) {
                    res.status(404).json({ error: 'Team not found' });
                    return;
                }

                for (const pid of playerIds) {
                    const [player] = await db.select({
                        id: players.id,
                        userId: players.userId,
                        batch: players.batch,
                        teamId: players.teamId,
                        profileImage: players.profileImage,
                        bio: players.bio,
                        isCaptain: players.isCaptain,
                        status: players.status,
                        jerseyNumber: players.jerseyNumber,
                        role: players.role,
                        totalRuns: players.totalRuns,
                        totalWickets: players.totalWickets,
                        matchesPlayed: players.matchesPlayed,
                        totalBallsFaced: players.totalBallsFaced,
                        totalBallsBowled: players.totalBallsBowled,
                        totalRunsConceded: players.totalRunsConceded,
                        totalSixes: players.totalSixes,
                        totalFours: players.totalFours,
                        totalCatches: players.totalCatches, teamToken: players.teamToken,
                        createdAt: players.createdAt,
                    }).from(players).where(eq(players.id, pid)).limit(1);
                    if (!player) continue;

                    // Generate a random 6-digit numeric token for team verification (used in email only)
                    const teamToken = Math.floor(100000 + Math.random() * 900000).toString();

                    // Update player: assign to team and mark as selected
                    await db.update(players).set({ teamId, status: 'selected' }).where(eq(players.id, pid));
                    console.log(`✅ Player ${pid} updated: teamId=${teamId}, status=selected`);

                    const [user] = await db.select({
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        password: users.password,
                        role: users.role,
                        activationToken: users.activationToken,
                        isActive: users.isActive,
                        createdAt: users.createdAt,
                        updatedAt: users.updatedAt,
                    }).from(users).where(eq(users.id, player.userId)).limit(1);
                    if (!user) {
                        console.warn(`⚠️ User not found for player ${pid}`);
                        continue;
                    }

                    console.log(`📧 Preparing email for user: ${user.email} (${user.name})`);
                    const activationToken = generateActivationToken({ userId: user.id, email: user.email });
                    await db.update(users).set({ activationToken }).where(eq(users.id, user.id));

                    const activationLink = `${FRONTEND_URL}/activate?token=${activationToken}`;
                    const emailData = playerSelectedEmail(user.name, team.name, activationLink, teamToken);
                    emailData.to = user.email;

                    try {
                        console.log(`🔄 Sending email to ${user.email}...`);
                        const emailSent = await sendEmail(emailData);
                        console.log(`✅ Email sending attempt for ${user.email}: ${emailSent ? 'Success' : 'Failed'}`);
                    } catch (emailError) {
                        console.error(`❌ Error sending email to ${user.email}:`, emailError);
                    }
                }

                console.log(`✅ Completed assign_team for ${playerIds.length} player(s)`);
                res.json({ message: `${playerIds.length} player(s) assigned to ${team.name}. Activation emails have been sent (or logged if in development mode).` });
                break;
            }

            case 'select': {
                for (const pid of playerIds) {
                    await db.update(players).set({ status: 'selected' }).where(eq(players.id, pid));
                }
                res.json({ message: `${playerIds.length} player(s) selected` });
                break;
            }

            case 'reject': {
                for (const pid of playerIds) {
                    await db.update(players).set({ status: 'rejected' }).where(eq(players.id, pid));
                }
                res.json({ message: `${playerIds.length} player(s) rejected` });
                break;
            }

            case 'delete': {
                for (const pid of playerIds) {
                    const [player] = await db.select({
                        id: players.id,
                        userId: players.userId,
                        batch: players.batch,
                        teamId: players.teamId,
                        profileImage: players.profileImage,
                        bio: players.bio,
                        isCaptain: players.isCaptain,
                        status: players.status,
                        jerseyNumber: players.jerseyNumber,
                        role: players.role,
                        totalRuns: players.totalRuns,
                        totalWickets: players.totalWickets,
                        matchesPlayed: players.matchesPlayed,
                        totalBallsFaced: players.totalBallsFaced,
                        totalBallsBowled: players.totalBallsBowled,
                        totalRunsConceded: players.totalRunsConceded,
                        totalSixes: players.totalSixes,
                        totalFours: players.totalFours,
                        totalCatches: players.totalCatches, teamToken: players.teamToken,
                        createdAt: players.createdAt,
                    }).from(players).where(eq(players.id, pid)).limit(1);
                    if (!player) continue;
                    await db.delete(players).where(eq(players.id, pid));
                    await db.delete(users).where(eq(users.id, player.userId));
                }
                res.json({ message: `${playerIds.length} player(s) deleted` });
                break;
            }

            case 'send_email': {
                for (const pid of playerIds) {
                    const [player] = await db.select({
                        id: players.id,
                        userId: players.userId,
                        batch: players.batch,
                        teamId: players.teamId,
                        profileImage: players.profileImage,
                        bio: players.bio,
                        isCaptain: players.isCaptain,
                        status: players.status,
                        jerseyNumber: players.jerseyNumber,
                        role: players.role,
                        totalRuns: players.totalRuns,
                        totalWickets: players.totalWickets,
                        matchesPlayed: players.matchesPlayed,
                        totalBallsFaced: players.totalBallsFaced,
                        totalBallsBowled: players.totalBallsBowled,
                        totalRunsConceded: players.totalRunsConceded,
                        totalSixes: players.totalSixes,
                        totalFours: players.totalFours,
                        totalCatches: players.totalCatches, teamToken: players.teamToken,
                        createdAt: players.createdAt,
                    }).from(players).where(eq(players.id, pid)).limit(1);
                    if (!player) continue;
                    const [user] = await db.select({
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        password: users.password,
                        role: users.role,
                        activationToken: users.activationToken,
                        isActive: users.isActive,
                        createdAt: users.createdAt,
                        updatedAt: users.updatedAt,
                    }).from(users).where(eq(users.id, player.userId)).limit(1);
                    if (!user) continue;

                    if (player.teamId) {
                        const [team] = await db.select({
                            id: teams.id,
                            name: teams.name,
                            logo: teams.logo,
                            shortName: teams.shortName,
                            color: teams.color,
                            createdAt: teams.createdAt,
                        }).from(teams).where(eq(teams.id, player.teamId)).limit(1);
                        if (team) {
                            const teamToken = player.teamToken || Math.floor(100000 + Math.random() * 900000).toString();
                            if (!player.teamToken) {
                                await db.update(players).set({ teamToken }).where(eq(players.id, player.id));
                            }

                            const activationToken = generateActivationToken({ userId: user.id, email: user.email });
                            await db.update(users).set({ activationToken }).where(eq(users.id, user.id));
                            const activationLink = `${FRONTEND_URL}/activate?token=${activationToken}`;
                            const emailData = playerSelectedEmail(user.name, team.name, activationLink, teamToken);
                            emailData.to = user.email;
                            await sendEmail(emailData);
                        }
                    }
                }
                res.json({ message: `Emails sent to ${playerIds.length} player(s)` });
                break;
            }
        }
    } catch (error) {
        console.error('❌ Bulk action error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({
            error: 'Bulk action failed',
            details: errorMessage,
            isDevelopment: process.env.NODE_ENV === 'development'
        });
    }
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
        const allPlayers = await db
            .select({
                id: players.id,
                name: users.name,
                teamId: players.teamId,
                profileImage: players.profileImage,
                totalRuns: players.totalRuns,
                totalWickets: players.totalWickets,
                matchesPlayed: players.matchesPlayed,
                totalSixes: players.totalSixes,
                totalFours: players.totalFours,
                totalBallsFaced: players.totalBallsFaced,
                totalBallsBowled: players.totalBallsBowled,
                totalRunsConceded: players.totalRunsConceded,
                totalCatches: players.totalCatches, teamToken: players.teamToken,
                isCaptain: players.isCaptain,
                role: players.role,
            })
            .from(players)
            .innerJoin(users, eq(players.userId, users.id))
            .where(eq(players.status, 'activated'));

        const teamsMap: Record<string, string> = {};
        const allTeams = await db.select().from(teams);
        allTeams.forEach(t => { teamsMap[t.id] = t.name; });

        const playersWithTeam = allPlayers.map(p => ({
            ...p,
            teamName: p.teamId ? teamsMap[p.teamId] || 'Unknown' : 'Unassigned',
            strikeRate: p.totalBallsFaced > 0 ? ((p.totalRuns / p.totalBallsFaced) * 100).toFixed(2) : '0.00',
            economyRate: p.totalBallsBowled > 0 ? ((p.totalRunsConceded / (p.totalBallsBowled / 6))).toFixed(2) : '0.00',
        }));

        const topBatsmen = [...playersWithTeam].sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 10);
        const topBowlers = [...playersWithTeam].sort((a, b) => b.totalWickets - a.totalWickets).slice(0, 10);
        const topSixes = [...playersWithTeam].sort((a, b) => b.totalSixes - a.totalSixes).slice(0, 10);

        res.json({ topBatsmen, topBowlers, topSixes, allPlayers: playersWithTeam });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
}

export async function getPlayerOfTheSeries(req: Request, res: Response): Promise<void> {
    try {
        const allPlayers = await db
            .select({
                id: players.id,
                name: users.name,
                teamId: players.teamId,
                profileImage: players.profileImage,
                totalRuns: players.totalRuns,
                totalWickets: players.totalWickets,
                totalCatches: players.totalCatches, teamToken: players.teamToken,
                totalSixes: players.totalSixes,
                totalFours: players.totalFours,
            })
            .from(players)
            .innerJoin(users, eq(players.userId, users.id))
            .where(eq(players.status, 'activated'));

        if (allPlayers.length === 0) {
            res.json(null);
            return;
        }

        const teamsMap: Record<string, string> = {};
        const allTeams = await db.select({
            id: teams.id,
            name: teams.name,
            logo: teams.logo,
            shortName: teams.shortName,
            color: teams.color,
            createdAt: teams.createdAt,
        }).from(teams);
        allTeams.forEach(t => { teamsMap[t.id] = t.name; });

        // Simple MVP Points formula:
        // Runs = 1 pt
        // Wickets = 25 pts
        // Catches = 10 pts
        // Sixes = Additional 2 pts
        // Fours = Additional 1 pt
        const rankedPlayers = allPlayers.map(p => {
            const points = (p.totalRuns || 0) +
                ((p.totalWickets || 0) * 25) +
                ((p.totalCatches || 0) * 10) +
                ((p.totalSixes || 0) * 2) +
                ((p.totalFours || 0) * 1);
            return {
                ...p,
                teamName: p.teamId ? teamsMap[p.teamId] : 'Unknown',
                points
            };
        }).sort((a, b) => b.points - a.points);

        res.json(rankedPlayers[0]); // Return the top player
    } catch (error) {
        console.error('Failed to calculate Player of the Series', error);
        res.status(500).json({ error: 'Failed to calculate Player of the Series' });
    }
}
export async function verifyTeamToken(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: 'Verification token is required' });
            return;
        }

        console.log(`[VerifyToken] User ${req.user.userId} is verifying with token: ${token}`);

        const [player] = await db.select().from(players).where(eq(players.userId, req.user.userId)).limit(1);
        if (!player) {
            res.status(404).json({ error: 'Player profile not found' });
            return;
        }

        if (player.status === 'activated') {
            res.status(400).json({ error: 'Profile already activated' });
            return;
        }

        if (player.status !== 'selected') {
            res.status(400).json({ error: 'You have not been selected for a team yet' });
            return;
        }

        // Verify that the token matches the teamToken stored in db
        if (player.teamToken !== token) {
            res.status(400).json({ error: 'Token invalid or already used' });
            return;
        }

        // Update player status to activated
        const [updatedPlayer] = await db.update(players).set({
            status: 'activated',
        }).where(eq(players.id, player.id)).returning();

        res.json({ message: 'Profile activated successfully! ✔️', player: updatedPlayer });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
}
