import { Request, Response } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, players, teams, pointsTable } from '../db/schema.js';
import { createTeamSchema, assignPlayersSchema, setCaptainSchema } from '../schemas/validation.js';
import { sendEmail, playerSelectedEmail, captainSelectedEmail } from '../services/email.js';
import { generateActivationToken } from '../utils/jwt.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export async function createTeam(req: Request, res: Response): Promise<void> {
    try {
        const parsed = createTeamSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { name, shortName, color } = parsed.data;

        const existing = await db.select().from(teams).where(eq(teams.name, name)).limit(1);
        if (existing.length > 0) {
            res.status(409).json({ error: 'Team name already exists' });
            return;
        }

        const [team] = await db.insert(teams).values({
            name,
            shortName: shortName || name.substring(0, 3).toUpperCase(),
            color: color || '#38bdf8',
            logo: req.body.logo || null,
        }).returning();

        await db.insert(pointsTable).values({ teamId: team.id });

        res.status(201).json({ message: 'Team created successfully', team });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
}

export async function getAllTeams(req: Request, res: Response): Promise<void> {
    try {
        const allTeams = await db.select().from(teams).orderBy(teams.createdAt);
        const teamsWithPlayers = await Promise.all(
            allTeams.map(async (team) => {
                const teamPlayers = await db
                    .select({
                        id: players.id,
                        userId: players.userId,
                        name: users.name,
                        email: users.email,
                        batch: players.batch,
                        profileImage: players.profileImage,
                        bio: players.bio,
                        isCaptain: players.isCaptain,
                        status: players.status,
                        jerseyNumber: players.jerseyNumber,
                        role: players.role,
                        totalRuns: players.totalRuns,
                        totalWickets: players.totalWickets,
                        matchesPlayed: players.matchesPlayed,
                    })
                    .from(players)
                    .innerJoin(users, eq(players.userId, users.id))
                    .where(eq(players.teamId, team.id));

                return { ...team, players: teamPlayers };
            })
        );
        res.json(teamsWithPlayers);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to get teams' });
    }
}

export async function getTeamById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }

        const teamPlayers = await db
            .select({
                id: players.id,
                userId: players.userId,
                name: users.name,
                email: users.email,
                batch: players.batch,
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
            })
            .from(players)
            .innerJoin(users, eq(players.userId, users.id))
            .where(eq(players.teamId, id));

        res.json({ ...team, players: teamPlayers });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get team' });
    }
}

export async function updateTeam(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { name, shortName, color, logo } = req.body;

        const [team] = await db.update(teams)
            .set({
                ...(name && { name }),
                ...(shortName && { shortName }),
                ...(color && { color }),
                ...(logo && { logo }),
            })
            .where(eq(teams.id, id))
            .returning();

        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }

        res.json({ message: 'Team updated successfully', team });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update team' });
    }
}

export async function deleteTeam(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        await db.update(players)
            .set({ teamId: null, isCaptain: false, status: 'pending' })
            .where(eq(players.teamId, id));

        await db.delete(pointsTable).where(eq(pointsTable.teamId, id));
        const [deleted] = await db.delete(teams).where(eq(teams.id, id)).returning();

        if (!deleted) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete team' });
    }
}

export async function assignPlayersToTeam(req: Request, res: Response): Promise<void> {
    try {
        const parsed = assignPlayersSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { playerIds, teamId } = parsed.data;

        const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }

        for (const playerId of playerIds) {
            const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
            if (!player) continue;

            const teamToken = Math.floor(100000 + Math.random() * 900000).toString();

            await db.update(players)
                .set({ teamId, status: 'selected', teamToken })
                .where(eq(players.id, playerId));

            const [user] = await db.select().from(users).where(eq(users.id, player.userId)).limit(1);
            if (!user) continue;

            const activationToken = generateActivationToken({ userId: user.id, email: user.email });
            await db.update(users)
                .set({ activationToken })
                .where(eq(users.id, user.id));

            const activationLink = `${FRONTEND_URL}/activate?token=${activationToken}`;
            const emailData = playerSelectedEmail(user.name, team.name, activationLink, teamToken);
            emailData.to = user.email;
            await sendEmail(emailData);
        }

        res.json({ message: `${playerIds.length} player(s) assigned to ${team.name}` });
    } catch (error) {
        console.error('Assign players error:', error);
        res.status(500).json({ error: 'Failed to assign players' });
    }
}

export async function removePlayerFromTeam(req: Request, res: Response): Promise<void> {
    try {
        const { playerId } = req.params;

        await db.update(players)
            .set({ teamId: null, isCaptain: false, status: 'pending' })
            .where(eq(players.id, playerId));

        res.json({ message: 'Player removed from team' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove player' });
    }
}

export async function setCaptain(req: Request, res: Response): Promise<void> {
    try {
        const parsed = setCaptainSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { playerId, teamId } = parsed.data;

        await db.update(players)
            .set({ isCaptain: false })
            .where(eq(players.teamId, teamId));

        await db.update(players)
            .set({ isCaptain: true })
            .where(and(eq(players.id, playerId), eq(players.teamId, teamId)));

        const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
        if (player) {
            const [user] = await db.select().from(users).where(eq(users.id, player.userId)).limit(1);
            const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
            if (user && team) {
                const emailData = captainSelectedEmail(user.name, team.name);
                emailData.to = user.email;
                await sendEmail(emailData);
            }
        }

        res.json({ message: 'Captain assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to set captain' });
    }
}
