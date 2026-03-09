import { Request, Response } from 'express';
import { eq, and, or, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { matches, scores, teams, players, users, pointsTable, tournamentSettings, commentary, matchPlayerStats } from '../db/schema.js';
import { createMatchSchema, updateMatchSchema, updateScoreSchema, autoGenerateMatchesSchema, addCommentarySchema } from '../schemas/validation.js';
import { sendEmail, matchScheduledEmail, finalMatchEmail } from '../services/email.js';

export async function createMatch(req: Request, res: Response): Promise<void> {
    try {
        const parsed = createMatchSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const data = parsed.data;

        if (data.teamAId === data.teamBId) {
            res.status(400).json({ error: 'Both teams cannot be the same' });
            return;
        }

        const [match] = await db.insert(matches).values({
            teamAId: data.teamAId,
            teamBId: data.teamBId,
            overs: data.overs,
            date: data.date,
            time: data.time,
            venue: data.venue,
            matchType: data.matchType || 'league',
        }).returning();

        await db.insert(scores).values({ matchId: match.id });

        const [teamA] = await db.select({
            id: teams.id,
            name: teams.name,
            logo: teams.logo,
            shortName: teams.shortName,
            color: teams.color,
            createdAt: teams.createdAt,
        }).from(teams).where(eq(teams.id, data.teamAId)).limit(1);
        const [teamB] = await db.select({
            id: teams.id,
            name: teams.name,
            logo: teams.logo,
            shortName: teams.shortName,
            color: teams.color,
            createdAt: teams.createdAt,
        }).from(teams).where(eq(teams.id, data.teamBId)).limit(1);

        if (teamA && teamB) {
            const teamAPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamA.id));
            const teamBPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamB.id));
            const allPlayerUserIds = [...teamAPlayers, ...teamBPlayers].map(p => p.userId);

            for (const uid of allPlayerUserIds) {
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
                }).from(users).where(eq(users.id, uid)).limit(1);
                if (user) {
                    const emailFn = data.matchType === 'final' ? finalMatchEmail : matchScheduledEmail;
                    const emailData = emailFn(user.name, teamA.name, teamB.name, data.date, data.time, data.venue);
                    emailData.to = user.email;
                    await sendEmail(emailData);
                }
            }
        }

        res.status(201).json({ message: 'Match created successfully', match });
    } catch (error) {
        console.error('Create match error:', error);
        res.status(500).json({ error: 'Failed to create match' });
    }
}

export async function getAllMatches(req: Request, res: Response): Promise<void> {
    try {
        console.log('getAllMatches called...');
        const { status, teamId } = req.query;
        let allMatches;

        if (status) {
            console.log('Fetching matches with status:', status);
            allMatches = await db.select({
                id: matches.id,
                teamAId: matches.teamAId,
                teamBId: matches.teamBId,
                overs: matches.overs,
                date: matches.date,
                time: matches.time,
                venue: matches.venue,
                status: matches.status,
                tossWinner: matches.tossWinner,
                tossDecision: matches.tossDecision,
                winnerTeamId: matches.winnerTeamId,
                manOfTheMatch: matches.manOfTheMatch,
                matchType: matches.matchType,
                createdAt: matches.createdAt,
            }).from(matches).where(eq(matches.status, status as any));
        } else if (teamId) {
            console.log('Fetching matches for teamId:', teamId);
            allMatches = await db.select({
                id: matches.id,
                teamAId: matches.teamAId,
                teamBId: matches.teamBId,
                overs: matches.overs,
                date: matches.date,
                time: matches.time,
                venue: matches.venue,
                status: matches.status,
                tossWinner: matches.tossWinner,
                tossDecision: matches.tossDecision,
                winnerTeamId: matches.winnerTeamId,
                manOfTheMatch: matches.manOfTheMatch,
                matchType: matches.matchType,
                createdAt: matches.createdAt,
            }).from(matches)
                .where(or(eq(matches.teamAId, teamId as string), eq(matches.teamBId, teamId as string)));
        } else {
            console.log('Fetching all matches without filters');
            allMatches = await db.select({
                id: matches.id,
                teamAId: matches.teamAId,
                teamBId: matches.teamBId,
                overs: matches.overs,
                date: matches.date,
                time: matches.time,
                venue: matches.venue,
                status: matches.status,
                tossWinner: matches.tossWinner,
                tossDecision: matches.tossDecision,
                winnerTeamId: matches.winnerTeamId,
                manOfTheMatch: matches.manOfTheMatch,
                matchType: matches.matchType,
                createdAt: matches.createdAt,
            }).from(matches);
        }

        console.log('Found matches:', allMatches.length);

        // Sort in JavaScript instead of database
        allMatches.sort((a, b) => {
            return (b.date as any) > (a.date as any) ? 1 : -1;
        });

        const matchesWithDetails = await Promise.all(
            allMatches.map(async (match) => {
                const [teamA] = await db.select().from(teams).where(eq(teams.id, match.teamAId)).limit(1);
                const [teamB] = await db.select().from(teams).where(eq(teams.id, match.teamBId)).limit(1);
                const [score] = await db.select().from(scores).where(eq(scores.matchId, match.id)).limit(1);

                let winnerTeam = null;
                if (match.winnerTeamId) {
                    const [wt] = await db.select().from(teams).where(eq(teams.id, match.winnerTeamId)).limit(1);
                    winnerTeam = wt;
                }

                let motm = null;
                if (match.manOfTheMatch) {
                    const [p] = await db
                        .select({ id: players.id, name: users.name, profileImage: players.profileImage })
                        .from(players)
                        .innerJoin(users, eq(players.userId, users.id))
                        .where(eq(players.id, match.manOfTheMatch))
                        .limit(1);
                    motm = p;
                }

                return { ...match, teamA, teamB, score, winnerTeam, manOfTheMatch: motm };
            })
        );

        console.log('Returning matches with details');
        res.json(matchesWithDetails);
    } catch (error) {
        console.error('Get all matches full error:', error);
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error || {}));

        let errorMessage = 'Unknown error';
        let errorDetails: any = null;

        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        } else if (typeof error === 'object' && error !== null) {
            errorMessage = JSON.stringify(error);
            errorDetails = error;
        } else {
            errorMessage = String(error);
        }

        res.status(500).json({
            error: 'Failed to get matches',
            errorMessage,
            errorDetails,
            isDevelopment: process.env.NODE_ENV === 'development'
        });
    }
}

export async function getMatchById(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const [match] = await db.select({
            id: matches.id,
            teamAId: matches.teamAId,
            teamBId: matches.teamBId,
            overs: matches.overs,
            date: matches.date,
            time: matches.time,
            venue: matches.venue,
            status: matches.status,
            tossWinner: matches.tossWinner,
            tossDecision: matches.tossDecision,
            winnerTeamId: matches.winnerTeamId,
            manOfTheMatch: matches.manOfTheMatch,
            matchType: matches.matchType,
            createdAt: matches.createdAt,
        }).from(matches).where(eq(matches.id, id)).limit(1);
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        const [teamA] = await db.select({
            id: teams.id,
            name: teams.name,
            logo: teams.logo,
            shortName: teams.shortName,
            color: teams.color,
            createdAt: teams.createdAt,
        }).from(teams).where(eq(teams.id, match.teamAId)).limit(1);
        const [teamB] = await db.select({
            id: teams.id,
            name: teams.name,
            logo: teams.logo,
            shortName: teams.shortName,
            color: teams.color,
            createdAt: teams.createdAt,
        }).from(teams).where(eq(teams.id, match.teamBId)).limit(1);
        const [score] = await db.select({
            id: scores.id,
            matchId: scores.matchId,
            teamARuns: scores.teamARuns,
            teamBRuns: scores.teamBRuns,
            teamAWickets: scores.teamAWickets,
            teamBWickets: scores.teamBWickets,
            teamAOversPlayed: scores.teamAOversPlayed,
            teamBOversPlayed: scores.teamBOversPlayed,
            teamAExtras: scores.teamAExtras,
            teamBExtras: scores.teamBExtras,
            currentInnings: scores.currentInnings,
            updatedAt: scores.updatedAt,
        }).from(scores).where(eq(scores.matchId, match.id)).limit(1);
        const matchCommentary = await db.select().from(commentary)
            .where(eq(commentary.matchId, match.id))
            .orderBy(desc(commentary.createdAt));

        let winnerTeam = null;
        if (match.winnerTeamId) {
            const [wt] = await db.select({
                id: teams.id,
                name: teams.name,
                logo: teams.logo,
                shortName: teams.shortName,
                color: teams.color,
                createdAt: teams.createdAt,
            }).from(teams).where(eq(teams.id, match.winnerTeamId)).limit(1);
            winnerTeam = wt;
        }

        res.json({ ...match, teamA, teamB, score, winnerTeam, commentary: matchCommentary });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get match' });
    }
}

export async function updateMatch(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const parsed = updateMatchSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const updates: any = {};
        const data = parsed.data;
        if (data.teamAId) updates.teamAId = data.teamAId;
        if (data.teamBId) updates.teamBId = data.teamBId;
        if (data.overs) updates.overs = data.overs;
        if (data.date) updates.date = data.date;
        if (data.time) updates.time = data.time;
        if (data.venue) updates.venue = data.venue;
        if (data.status) updates.status = data.status;
        if (data.matchType) updates.matchType = data.matchType;

        if (req.body.winnerTeamId !== undefined) updates.winnerTeamId = req.body.winnerTeamId;
        if (req.body.manOfTheMatch !== undefined) updates.manOfTheMatch = req.body.manOfTheMatch;
        if (req.body.tossWinner !== undefined) updates.tossWinner = req.body.tossWinner;
        if (req.body.tossDecision !== undefined) updates.tossDecision = req.body.tossDecision;

        const [oldMatch] = await db.select({
            id: matches.id,
            teamAId: matches.teamAId,
            teamBId: matches.teamBId,
            overs: matches.overs,
            date: matches.date,
            time: matches.time,
            venue: matches.venue,
            status: matches.status,
            tossWinner: matches.tossWinner,
            tossDecision: matches.tossDecision,
            winnerTeamId: matches.winnerTeamId,
            manOfTheMatch: matches.manOfTheMatch,
            matchType: matches.matchType,
            createdAt: matches.createdAt,
        }).from(matches).where(eq(matches.id, id)).limit(1);

        const [match] = await db.update(matches).set(updates).where(eq(matches.id, id)).returning();
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        // Send email if schedule changed
        if (data.date || data.time || data.venue) {
            const [teamA] = await db.select({
                id: teams.id,
                name: teams.name,
                logo: teams.logo,
                shortName: teams.shortName,
                color: teams.color,
                createdAt: teams.createdAt,
            }).from(teams).where(eq(teams.id, match.teamAId)).limit(1);
            const [teamB] = await db.select({
                id: teams.id,
                name: teams.name,
                logo: teams.logo,
                shortName: teams.shortName,
                color: teams.color,
                createdAt: teams.createdAt,
            }).from(teams).where(eq(teams.id, match.teamBId)).limit(1);

            if (teamA && teamB) {
                const teamAPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamA.id));
                const teamBPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamB.id));
                const allPlayerUserIds = [...teamAPlayers, ...teamBPlayers].map(p => p.userId);

                for (const uid of allPlayerUserIds) {
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
                    }).from(users).where(eq(users.id, uid)).limit(1);
                    if (user) {
                        const emailData = matchScheduledEmail(user.name, teamA.name, teamB.name, match.date, match.time, match.venue);
                        emailData.to = user.email;
                        emailData.subject = `⚠️ Updated Match Schedule: ${teamA.name} vs ${teamB.name}`;
                        await sendEmail(emailData);
                    }
                }
            }
        }

        res.json({ message: 'Match updated successfully', match });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update match' });
    }
}

export async function deleteMatch(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        await db.delete(commentary).where(eq(commentary.matchId, id));
        await db.delete(scores).where(eq(scores.matchId, id));
        await db.delete(matchPlayerStats).where(eq(matchPlayerStats.matchId, id));
        const [deleted] = await db.delete(matches).where(eq(matches.id, id)).returning();
        if (!deleted) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }
        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete match' });
    }
}

export async function updateScore(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const parsed = updateScoreSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const updates: any = { updatedAt: new Date() };
        const data = parsed.data;
        if (data.teamARuns !== undefined) updates.teamARuns = data.teamARuns;
        if (data.teamBRuns !== undefined) updates.teamBRuns = data.teamBRuns;
        if (data.teamAWickets !== undefined) updates.teamAWickets = data.teamAWickets;
        if (data.teamBWickets !== undefined) updates.teamBWickets = data.teamBWickets;
        if (data.teamAOversPlayed !== undefined) updates.teamAOversPlayed = data.teamAOversPlayed;
        if (data.teamBOversPlayed !== undefined) updates.teamBOversPlayed = data.teamBOversPlayed;
        if (data.teamAExtras !== undefined) updates.teamAExtras = data.teamAExtras;
        if (data.teamBExtras !== undefined) updates.teamBExtras = data.teamBExtras;
        if (data.currentInnings !== undefined) updates.currentInnings = data.currentInnings;

        const [score] = await db.update(scores).set(updates).where(eq(scores.matchId, id)).returning();
        if (!score) {
            res.status(404).json({ error: 'Score not found for this match' });
            return;
        }

        res.json({ message: 'Score updated', score });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update score' });
    }
}

export async function completeMatch(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { winnerTeamId, manOfTheMatch } = req.body;

        const [match] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        const settings = await db.select().from(tournamentSettings).limit(1);
        const pointsPerWin = settings[0]?.pointsPerWin || 2;
        const pointsPerLoss = settings[0]?.pointsPerLoss || 0;
        const pointsPerNoResult = settings[0]?.pointsPerNoResult || 1;

        // Handle no_result or postponed
        if (req.body.status === 'no_result' || req.body.status === 'postponed' || !winnerTeamId) {
            await db.update(matches).set({
                status: req.body.status || 'no_result',
                winnerTeamId: null,
                manOfTheMatch: null,
            }).where(eq(matches.id, id));

            for (const teamId of [match.teamAId, match.teamBId]) {
                const [existing] = await db.select().from(pointsTable).where(eq(pointsTable.teamId, teamId)).limit(1);
                if (existing) {
                    await db.update(pointsTable).set({
                        matchesPlayed: existing.matchesPlayed + 1,
                        points: existing.points + pointsPerNoResult,
                    }).where(eq(pointsTable.teamId, teamId));
                }
            }
            res.json({ message: 'Match marked as no result/postponed and points table updated' });
            return;
        }

        await db.update(matches).set({
            status: 'completed',
            winnerTeamId,
            manOfTheMatch: manOfTheMatch || null,
        }).where(eq(matches.id, id));

        const [score] = await db.select().from(scores).where(eq(scores.matchId, id)).limit(1);
        if (!score) {
            res.json({ message: 'Match completed (no score found)' });
            return;
        }

        const loserTeamId = winnerTeamId === match.teamAId ? match.teamBId : match.teamAId;

        for (const teamId of [match.teamAId, match.teamBId]) {
            const isWinner = teamId === winnerTeamId;
            const isTeamA = teamId === match.teamAId;

            const runsScored = isTeamA ? score.teamARuns : score.teamBRuns;
            const oversPlayed = isTeamA ? score.teamAOversPlayed : score.teamBOversPlayed;
            const runsConceded = isTeamA ? score.teamBRuns : score.teamARuns;
            const oversBowled = isTeamA ? score.teamBOversPlayed : score.teamAOversPlayed;

            const [existing] = await db.select().from(pointsTable).where(eq(pointsTable.teamId, teamId)).limit(1);

            if (existing) {
                const newMatchesPlayed = existing.matchesPlayed + 1;
                const newWins = existing.wins + (isWinner ? 1 : 0);
                const newLosses = existing.losses + (isWinner ? 0 : 1);
                const newPoints = existing.points + (isWinner ? pointsPerWin : pointsPerLoss);
                const newTotalRunsScored = existing.totalRunsScored + runsScored;
                const newTotalOversPlayed = existing.totalOversPlayed + oversPlayed;
                const newTotalRunsConceded = existing.totalRunsConceded + runsConceded;
                const newTotalOversBowled = existing.totalOversBowled + oversBowled;

                let nrr = 0;
                if (newTotalOversPlayed > 0 && newTotalOversBowled > 0) {
                    nrr = (newTotalRunsScored / newTotalOversPlayed) - (newTotalRunsConceded / newTotalOversBowled);
                }

                await db.update(pointsTable).set({
                    matchesPlayed: newMatchesPlayed,
                    wins: newWins,
                    losses: newLosses,
                    points: newPoints,
                    nrr: parseFloat(nrr.toFixed(3)),
                    totalRunsScored: newTotalRunsScored,
                    totalOversPlayed: newTotalOversPlayed,
                    totalRunsConceded: newTotalRunsConceded,
                    totalOversBowled: newTotalOversBowled,
                }).where(eq(pointsTable.teamId, teamId));
            }
        }

        res.json({ message: 'Match completed and points table updated' });
    } catch (error) {
        console.error('Complete match error:', error);
        res.status(500).json({ error: 'Failed to complete match' });
    }
}

export async function autoGenerateMatches(req: Request, res: Response): Promise<void> {
    try {
        const parsed = autoGenerateMatchesSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const { matchesPerTeam, defaultOvers, venue, startDate, startTime } = parsed.data;
        const allTeams = await db.select().from(teams);

        if (allTeams.length < 2) {
            res.status(400).json({ error: 'Need at least 2 teams to generate matches' });
            return;
        }

        const matchPairs: [string, string][] = [];
        const teamMatchCount: Record<string, number> = {};
        allTeams.forEach(t => { teamMatchCount[t.id] = 0; });

        for (let i = 0; i < allTeams.length; i++) {
            for (let j = i + 1; j < allTeams.length; j++) {
                if (teamMatchCount[allTeams[i].id] < matchesPerTeam && teamMatchCount[allTeams[j].id] < matchesPerTeam) {
                    matchPairs.push([allTeams[i].id, allTeams[j].id]);
                    teamMatchCount[allTeams[i].id]++;
                    teamMatchCount[allTeams[j].id]++;
                }
            }
        }

        const createdMatches = [];
        const baseDate = new Date(startDate);

        for (let i = 0; i < matchPairs.length; i++) {
            const matchDate = new Date(baseDate);
            matchDate.setDate(matchDate.getDate() + i);
            const dateStr = matchDate.toISOString().split('T')[0];

            const [match] = await db.insert(matches).values({
                teamAId: matchPairs[i][0],
                teamBId: matchPairs[i][1],
                overs: defaultOvers,
                date: dateStr,
                time: startTime,
                venue,
                matchType: 'league',
            }).returning();

            await db.insert(scores).values({ matchId: match.id });
            createdMatches.push(match);
        }

        res.json({
            message: `${createdMatches.length} matches generated automatically`,
            matches: createdMatches,
        });
    } catch (error) {
        console.error('Auto generate error:', error);
        res.status(500).json({ error: 'Failed to auto-generate matches' });
    }
}

export async function getPointsTable(req: Request, res: Response): Promise<void> {
    try {
        const points = await db.select().from(pointsTable).orderBy(desc(pointsTable.points));

        const pointsWithTeams = await Promise.all(
            points.map(async (p) => {
                const [team] = await db.select().from(teams).where(eq(teams.id, p.teamId)).limit(1);
                return { ...p, team };
            })
        );

        pointsWithTeams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.nrr - a.nrr;
        });

        res.json(pointsWithTeams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get points table' });
    }
}

export async function addCommentary(req: Request, res: Response): Promise<void> {
    try {
        const parsed = addCommentarySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }

        const [entry] = await db.insert(commentary).values(parsed.data).returning();
        res.status(201).json({ message: 'Commentary added', entry });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add commentary' });
    }
}

export async function getCommentary(req: Request, res: Response): Promise<void> {
    try {
        const { matchId } = req.params;
        const entries = await db.select().from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt));
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get commentary' });
    }
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
        const allTeams = await db.select({
            id: teams.id,
            name: teams.name,
            logo: teams.logo,
            shortName: teams.shortName,
            color: teams.color,
            createdAt: teams.createdAt,
        }).from(teams);
        const allPlayers = await db.select({
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
            totalCatches: players.totalCatches,
            createdAt: players.createdAt,
        }).from(players);
        const allMatches = await db.select({
            id: matches.id,
            teamAId: matches.teamAId,
            teamBId: matches.teamBId,
            overs: matches.overs,
            date: matches.date,
            time: matches.time,
            venue: matches.venue,
            status: matches.status,
            tossWinner: matches.tossWinner,
            tossDecision: matches.tossDecision,
            winnerTeamId: matches.winnerTeamId,
            manOfTheMatch: matches.manOfTheMatch,
            matchType: matches.matchType,
            createdAt: matches.createdAt,
        }).from(matches);

        const totalTeams = allTeams.length;
        const totalPlayers = allPlayers.length;
        const totalMatches = allMatches.length;
        const completedMatches = allMatches.filter(m => m.status === 'completed').length;
        const upcomingMatches = allMatches.filter(m => m.status === 'upcoming').length;
        const liveMatches = allMatches.filter(m => m.status === 'live').length;
        const pendingPlayers = allPlayers.filter(p => p.status === 'pending').length;
        const selectedPlayers = allPlayers.filter(p => p.status === 'selected' || p.status === 'activated').length;

        const batchDistribution: Record<string, number> = {};
        allPlayers.forEach(p => {
            batchDistribution[p.batch] = (batchDistribution[p.batch] || 0) + 1;
        });

        const teamPerformance = await Promise.all(
            allTeams.map(async (team) => {
                const [pts] = await db.select({
                    id: pointsTable.id,
                    teamId: pointsTable.teamId,
                    matchesPlayed: pointsTable.matchesPlayed,
                    wins: pointsTable.wins,
                    losses: pointsTable.losses,
                    points: pointsTable.points,
                    nrr: pointsTable.nrr,
                    totalRunsScored: pointsTable.totalRunsScored,
                }).from(pointsTable).where(eq(pointsTable.teamId, team.id)).limit(1);
                return {
                    team: team.name,
                    wins: pts?.wins || 0,
                    losses: pts?.losses || 0,
                    points: pts?.points || 0,
                    nrr: pts?.nrr || 0,
                };
            })
        );

        const matchScores = await Promise.all(
            allMatches.filter(m => m.status === 'completed').map(async (match) => {
                const [score] = await db.select({
                    id: scores.id,
                    matchId: scores.matchId,
                    teamARuns: scores.teamARuns,
                    teamBRuns: scores.teamBRuns,
                    teamAWickets: scores.teamAWickets,
                    teamBWickets: scores.teamBWickets,
                    teamAOversPlayed: scores.teamAOversPlayed,
                    teamBOversPlayed: scores.teamBOversPlayed,
                    teamAExtras: scores.teamAExtras,
                    teamBExtras: scores.teamBExtras,
                    currentInnings: scores.currentInnings,
                    updatedAt: scores.updatedAt,
                }).from(scores).where(eq(scores.matchId, match.id)).limit(1);
                const [teamA] = await db.select({
                    id: teams.id,
                    name: teams.name,
                    logo: teams.logo,
                    shortName: teams.shortName,
                    color: teams.color,
                    createdAt: teams.createdAt,
                }).from(teams).where(eq(teams.id, match.teamAId)).limit(1);
                const [teamB] = await db.select({
                    id: teams.id,
                    name: teams.name,
                    logo: teams.logo,
                    shortName: teams.shortName,
                    color: teams.color,
                    createdAt: teams.createdAt,
                }).from(teams).where(eq(teams.id, match.teamBId)).limit(1);
                return {
                    match: `${teamA?.shortName || 'A'} vs ${teamB?.shortName || 'B'}`,
                    totalRuns: (score?.teamARuns || 0) + (score?.teamBRuns || 0),
                };
            })
        );

        res.json({
            totalTeams,
            totalPlayers,
            totalMatches,
            completedMatches,
            upcomingMatches,
            liveMatches,
            pendingPlayers,
            selectedPlayers,
            batchDistribution,
            teamPerformance,
            matchScores,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to get dashboard stats', details: error instanceof Error ? error.message : String(error) });
    }
}

export async function getTournamentSettings(req: Request, res: Response): Promise<void> {
    try {
        let [settings] = await db.select().from(tournamentSettings).limit(1);
        if (!settings) {
            [settings] = await db.insert(tournamentSettings).values({}).returning();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get settings' });
    }
}

export async function updateTournamentSettings(req: Request, res: Response): Promise<void> {
    try {
        let [settings] = await db.select().from(tournamentSettings).limit(1);
        if (!settings) {
            [settings] = await db.insert(tournamentSettings).values(req.body).returning();
        } else {
            [settings] = await db.update(tournamentSettings).set(req.body).where(eq(tournamentSettings.id, settings.id)).returning();
        }
        res.json({ message: 'Settings updated', settings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
}

export async function getMatchPlayerStats(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const stats = await db
            .select({
                id: matchPlayerStats.id,
                matchId: matchPlayerStats.matchId,
                playerId: matchPlayerStats.playerId,
                teamId: matchPlayerStats.teamId,
                runsScored: matchPlayerStats.runsScored,
                ballsFaced: matchPlayerStats.ballsFaced,
                fours: matchPlayerStats.fours,
                sixes: matchPlayerStats.sixes,
                wickets: matchPlayerStats.wickets,
                runsConceded: matchPlayerStats.runsConceded,
                ballsBowled: matchPlayerStats.ballsBowled,
                catches: matchPlayerStats.catches,
                playerName: users.name,
                playerRole: players.role,
                profileImage: players.profileImage,
            })
            .from(matchPlayerStats)
            .innerJoin(players, eq(matchPlayerStats.playerId, players.id))
            .innerJoin(users, eq(players.userId, users.id))
            .where(eq(matchPlayerStats.matchId, id));

        res.json(stats);
    } catch (error) {
        console.error('Failed to get match player stats:', error);
        res.status(500).json({ error: 'Failed' });
    }
}

export async function updateMatchPlayerStats(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { stats } = req.body; // Array of stat objects

        // Delete existing and insert new
        await db.delete(matchPlayerStats).where(eq(matchPlayerStats.matchId, id));

        if (stats && stats.length > 0) {
            const inserts = stats.map((s: any) => ({
                matchId: id,
                playerId: s.playerId,
                teamId: s.teamId,
                runsScored: s.runsScored || 0,
                ballsFaced: s.ballsFaced || 0,
                fours: s.fours || 0,
                sixes: s.sixes || 0,
                wickets: s.wickets || 0,
                runsConceded: s.runsConceded || 0,
                ballsBowled: s.ballsBowled || 0,
                catches: s.catches || 0,
            }));
            await db.insert(matchPlayerStats).values(inserts);

            // Recompute total stats for all players involved
            for (const s of stats) {
                const playerMatches = await db.select().from(matchPlayerStats).where(eq(matchPlayerStats.playerId, s.playerId));
                const totalRuns = playerMatches.reduce((acc, curr) => acc + curr.runsScored, 0);
                const totalWickets = playerMatches.reduce((acc, curr) => acc + curr.wickets, 0);
                const totalBallsFaced = playerMatches.reduce((acc, curr) => acc + curr.ballsFaced, 0);
                const totalBallsBowled = playerMatches.reduce((acc, curr) => acc + curr.ballsBowled, 0);
                const totalRunsConceded = playerMatches.reduce((acc, curr) => acc + curr.runsConceded, 0);
                const totalSixes = playerMatches.reduce((acc, curr) => acc + curr.sixes, 0);
                const totalFours = playerMatches.reduce((acc, curr) => acc + curr.fours, 0);
                const totalCatches = playerMatches.reduce((acc, curr) => acc + curr.catches, 0);
                const matchesPlayed = playerMatches.length; // Actually, only matches where they played should count but this is fine.

                await db.update(players).set({
                    totalRuns,
                    totalWickets,
                    totalBallsFaced,
                    totalBallsBowled,
                    totalRunsConceded,
                    totalSixes,
                    totalFours,
                    totalCatches,
                    matchesPlayed
                }).where(eq(players.id, s.playerId));
            }
        }

        res.json({ message: 'Stats updated successfully' });
    } catch (error) {
        console.error('Failed to update match player stats:', error);
        res.status(500).json({ error: 'Failed to update stats' });
    }
}
