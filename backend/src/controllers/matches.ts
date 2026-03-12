import { Request, Response } from 'express';
import { eq, and, or, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { matches, scores, teams, players, users, pointsTable, tournamentSettings, commentary, matchPlayerStats } from '../db/schema.js';
import { createMatchSchema, updateMatchSchema, updateScoreSchema, autoGenerateMatchesSchema, addCommentarySchema } from '../schemas/validation.js';
import { sendEmail, matchScheduledEmail, finalMatchEmail, matchResultsEmail, preMatchReminderEmail } from '../services/email.js';

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

        const conditions = [];
        if (status) conditions.push(eq(matches.status, status as any));
        if (teamId) conditions.push(or(eq(matches.teamAId, teamId as string), eq(matches.teamBId, teamId as string)));

        if (conditions.length > 0) {
            allMatches = await db.select().from(matches).where(and(...conditions));
        } else {
            allMatches = await db.select().from(matches);
        }

        console.log('Found matches:', allMatches.length);

        // Sort in JavaScript instead of database
        // Sort matches: Live first, then Upcoming (closest first), then Completed (latest first)
        allMatches.sort((a, b) => {
            const statusOrder = { live: 0, upcoming: 1, completed: 2, cancelled: 3, no_result: 3, postponed: 3 };
            const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 99;
            const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 99;

            if (statusA !== statusB) return statusA - statusB;

            // Same status -> sort by date
            if (a.status === 'upcoming') {
                return (a.date as string) > (b.date as string) ? 1 : -1;
            } else {
                return (b.date as string) > (a.date as string) ? 1 : -1;
            }
        });

        const matchesWithDetails = await Promise.all(
            allMatches.map(async (match) => {
                const teamARecords = await db.select().from(teams).where(eq(teams.id, match.teamAId)).limit(1);
                const teamA = teamARecords[0] || null;

                const teamBRecords = await db.select().from(teams).where(eq(teams.id, match.teamBId)).limit(1);
                const teamB = teamBRecords[0] || null;

                const scoreRecords = await db.select().from(scores).where(eq(scores.matchId, match.id)).limit(1);
                const score = scoreRecords[0] || null;

                let winnerTeam = null;
                if (match.winnerTeamId) {
                    const wtRecs = await db.select().from(teams).where(eq(teams.id, match.winnerTeamId)).limit(1);
                    winnerTeam = wtRecs[0] || null;
                }

                let motm = null;
                if (match.manOfTheMatch) {
                    const playerRecs = await db.select().from(players).where(eq(players.id, match.manOfTheMatch)).limit(1);
                    if (playerRecs[0]) {
                        const userRecs = await db.select().from(users).where(eq(users.id, playerRecs[0].userId)).limit(1);
                        motm = {
                            id: playerRecs[0].id,
                            name: userRecs[0]?.name || 'Unknown',
                            profileImage: playerRecs[0].profileImage
                        };
                    }
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
        const matchRecords = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
        const match = matchRecords[0];

        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        const teamARecords = await db.select().from(teams).where(eq(teams.id, match.teamAId)).limit(1);
        const teamA = teamARecords[0] || null;

        const teamBRecords = await db.select().from(teams).where(eq(teams.id, match.teamBId)).limit(1);
        const teamB = teamBRecords[0] || null;

        const scoreRecords = await db.select().from(scores).where(eq(scores.matchId, match.id)).limit(1);
        const score = scoreRecords[0] || null;

        const matchCommentary = await db.select().from(commentary)
            .where(eq(commentary.matchId, match.id))
            .orderBy(desc(commentary.createdAt));

        let winnerTeam = null;
        if (match.winnerTeamId) {
            const wtRecords = await db.select().from(teams).where(eq(teams.id, match.winnerTeamId)).limit(1);
            winnerTeam = wtRecords[0] || null;
        }

        let motm = null;
        if (match.manOfTheMatch) {
            // Use simple query for MOTM to avoid join errors
            const playerRecs = await db.select().from(players).where(eq(players.id, match.manOfTheMatch)).limit(1);
            if (playerRecs[0]) {
                const userRecs = await db.select().from(users).where(eq(users.id, playerRecs[0].userId)).limit(1);
                motm = {
                    id: playerRecs[0].id,
                    name: userRecs[0]?.name || 'Unknown',
                    profileImage: playerRecs[0].profileImage
                };
            }
        }

        res.json({ ...match, teamA, teamB, score, winnerTeam, manOfTheMatch: motm, commentary: matchCommentary });
    } catch (error: any) {
        console.error('[getMatchById] Critical Failure:', error);
        res.status(500).json({ error: 'Failed to get match: ' + error.message });
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
        if (data.scoreboardImage !== undefined) updates.scoreboardImage = data.scoreboardImage;

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
            scoreboardImage: matches.scoreboardImage,
            createdAt: matches.createdAt,
        }).from(matches).where(eq(matches.id, id)).limit(1);

        let match = oldMatch;
        if (Object.keys(updates).length > 0) {
            const updatedMatches = await db.update(matches).set(updates).where(eq(matches.id, id)).returning();
            match = updatedMatches[0];
            if (!match) {
                res.status(404).json({ error: 'Match not found' });
                return;
            }
        }

        // Recalculate standings in case status, teams, or winner changed
        await recalculatePointsTable();

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
    } catch (error: any) {
        console.error('Update match error:', error);
        res.status(500).json({ error: 'Failed to update match', details: error.message });
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

        // Always recalculate points table when scores are updated to ensure NRR is current
        // This handles both live updates and post-match adjustments
        await recalculatePointsTable();

        res.json({ message: 'Score updated', score });
    } catch (error) {
        console.error('Update score error:', error);
        res.status(500).json({ error: 'Failed to update score', details: (error as Error).message });
    }
}

// Helper to handle cricket over notation (e.g., 10.5 = 10 overs and 5 balls = 10.833 overs)
function toDecimalOvers(overs: number): number {
    if (!overs) return 0;
    const whole = Math.floor(overs);
    const fraction = parseFloat((overs - whole).toFixed(1));

    // If it looks like cricket notation (e.g., .1 to .6)
    if (fraction >= 0.1 && fraction <= 0.6) {
        const balls = Math.round(fraction * 10);
        // Standard cricket: 6 balls = 1 over. So .1 is 1/6, .5 is 5/6, .6 is 6/6=1.0
        return whole + (Math.min(balls, 6) / 6);
    }

    // Otherwise treat as a pure decimal (already converted or whole number)
    return overs;
}

// Helper to completely recalculate the points table
export async function recalculatePointsTable() {
    try {
        console.log('🔄 Recalculating Points Table...');
        const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams);
        console.log(`Processing ${allTeams.length} teams`);
        const settings = await db.select().from(tournamentSettings).limit(1);
        const pts = settings[0] || { pointsPerWin: 2, pointsPerLoss: 0, pointsPerNoResult: 1, defaultOvers: 10, playersPerTeam: 11 };
        const pointsPerWin = pts.pointsPerWin;
        const pointsPerLoss = pts.pointsPerLoss;
        const pointsPerNoResult = pts.pointsPerNoResult;
        const defaultOvers = pts.defaultOvers;
        const playersPerTeam = pts.playersPerTeam;
        const allOutWickets = playersPerTeam - 1;

        for (const team of allTeams) {
            const teamMatches = await db.select({
                id: matches.id,
                teamAId: matches.teamAId,
                teamBId: matches.teamBId,
                status: matches.status,
                winnerTeamId: matches.winnerTeamId,
                overs: matches.overs,
            }).from(matches).where(
                and(
                    eq(matches.matchType, 'league'),
                    or(eq(matches.teamAId, team.id), eq(matches.teamBId, team.id))
                )
            );

            let stats = {
                played: 0,
                wins: 0,
                losses: 0,
                ties: 0,
                noResults: 0,
                points: 0,
                totalRunsScored: 0,
                totalOversPlayed: 0,
                totalRunsConceded: 0,
                totalOversBowled: 0,
            };

            for (const match of teamMatches) {
                if (!['completed', 'no_result', 'cancelled'].includes(match.status)) continue;

                stats.played++;
                const [score] = await db.select().from(scores).where(eq(scores.matchId, match.id)).limit(1);
                if (!score) continue;

                const isTeamA = match.teamAId === team.id;
                const teamRuns = isTeamA ? (score.teamARuns || 0) : (score.teamBRuns || 0);
                const oppRuns = isTeamA ? (score.teamBRuns || 0) : (score.teamARuns || 0);
                const teamWickets = isTeamA ? (score.teamAWickets || 0) : (score.teamBWickets || 0);
                const oppWickets = isTeamA ? (score.teamBWickets || 0) : (score.teamAWickets || 0);
                const teamOversActual = isTeamA ? (score.teamAOversPlayed || 0) : (score.teamBOversPlayed || 0);
                const oppOversActual = isTeamA ? (score.teamBOversPlayed || 0) : (score.teamAOversPlayed || 0);
                const matchOverQuota = match.overs || defaultOvers;

                // Points allocation
                if (match.status === 'completed') {
                    if (match.winnerTeamId === team.id) {
                        stats.wins++;
                        stats.points += pointsPerWin;
                    } else if (match.winnerTeamId) {
                        stats.losses++;
                        stats.points += pointsPerLoss;
                    } else {
                        stats.ties++;
                        stats.points += pointsPerNoResult;
                    }
                } else {
                    stats.noResults++;
                    stats.points += pointsPerNoResult;
                }

                // NRR components
                // If all out, use full quota. Otherwise use actual overs.
                const teamEffectiveOvers = (teamWickets >= allOutWickets) ? matchOverQuota : toDecimalOvers(teamOversActual);
                const oppEffectiveOvers = (oppWickets >= allOutWickets) ? matchOverQuota : toDecimalOvers(oppOversActual);

                stats.totalRunsScored += Number(teamRuns || 0);
                stats.totalOversPlayed += Number(teamEffectiveOvers || 0);
                stats.totalRunsConceded += Number(oppRuns || 0);
                stats.totalOversBowled += Number(oppEffectiveOvers || 0);

                console.log(`   [Match ${match.id}] ${team.name}: ${teamRuns}/${teamWickets} in ${teamEffectiveOvers} overs (Opp: ${oppRuns}/${oppWickets} in ${oppEffectiveOvers})`);
            }

            // Calculate final NRR
            let finalNrr = 0;
            console.log(`   [Debug] ${team.name} final totals: Scored=${stats.totalRunsScored}, Played=${stats.totalOversPlayed}, Conceded=${stats.totalRunsConceded}, Bowled=${stats.totalOversBowled}`);

            if (stats.totalOversPlayed > 0 && stats.totalOversBowled > 0) {
                const scoredRR = stats.totalRunsScored / stats.totalOversPlayed;
                const concededRR = stats.totalRunsConceded / stats.totalOversBowled;
                finalNrr = scoredRR - concededRR;
                console.log(`   [Recalc] ${team.name}: ScoredRR=${scoredRR.toFixed(3)}, ConcededRR=${concededRR.toFixed(3)}, NRR=${finalNrr.toFixed(3)}`);
            } else {
                console.log(`   [Recalc] ${team.name}: Overs played/bowled is 0 or NaN, skipping NRR calculation`);
            }

            // Final NaN check
            if (isNaN(finalNrr)) finalNrr = 0;
            stats.totalRunsScored = stats.totalRunsScored || 0;
            stats.totalOversPlayed = stats.totalOversPlayed || 0;
            stats.totalRunsConceded = stats.totalRunsConceded || 0;
            stats.totalOversBowled = stats.totalOversBowled || 0;

            console.log(`✅ Updated Points Table for ${team.name}: P=${stats.played} W=${stats.wins} NRR=${finalNrr.toFixed(3)}`);

            await db.insert(pointsTable)
                .values({
                    teamId: team.id,
                    matchesPlayed: stats.played,
                    wins: stats.wins,
                    losses: stats.losses,
                    points: stats.points,
                    nrr: finalNrr,
                    totalRunsScored: stats.totalRunsScored,
                    totalOversPlayed: stats.totalOversPlayed,
                    totalRunsConceded: stats.totalRunsConceded,
                    totalOversBowled: stats.totalOversBowled,
                })
                .onConflictDoUpdate({
                    target: pointsTable.teamId,
                    set: {
                        matchesPlayed: stats.played,
                        wins: stats.wins,
                        losses: stats.losses,
                        points: stats.points,
                        nrr: finalNrr,
                        totalRunsScored: stats.totalRunsScored,
                        totalOversPlayed: stats.totalOversPlayed,
                        totalRunsConceded: stats.totalRunsConceded,
                        totalOversBowled: stats.totalOversBowled,
                    },
                });
        }
    } catch (error) {
        console.error('Points table recalculation failed:', error);
    }
}

export async function completeMatch(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const { winnerTeamId, manOfTheMatch } = req.body;

        const [match] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        // Handle no_result or postponed
        if (req.body.status === 'no_result' || req.body.status === 'postponed' || !winnerTeamId) {
            await db.update(matches).set({
                status: req.body.status || 'no_result',
                winnerTeamId: null,
                manOfTheMatch: null,
            }).where(eq(matches.id, id));

            await recalculatePointsTable();
            res.json({ message: 'Match marked as no result/postponed and points table updated' });
            return;
        }

        await db.update(matches).set({
            status: 'completed',
            winnerTeamId,
            manOfTheMatch: manOfTheMatch || null,
        }).where(eq(matches.id, id));

        await recalculatePointsTable();

        // Send results email to all players from both teams
        try {
            const [teamA] = await db.select().from(teams).where(eq(teams.id, match.teamAId)).limit(1);
            const [teamB] = await db.select().from(teams).where(eq(teams.id, match.teamBId)).limit(1);
            const [winnerTeam] = winnerTeamId ? await db.select().from(teams).where(eq(teams.id, winnerTeamId)).limit(1) : [null];
            const [score] = await db.select().from(scores).where(eq(scores.matchId, id)).limit(1);

            let motmName = 'N/A';
            if (manOfTheMatch) {
                const [p] = await db.select().from(players).where(eq(players.id, manOfTheMatch)).limit(1);
                if (p) {
                    const [u] = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
                    motmName = u?.name || 'N/A';
                }
            }

            const teamAPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, match.teamAId));
            const teamBPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, match.teamBId));
            const allPlayerUserIds = [...teamAPlayers, ...teamBPlayers].map(p => p.userId);

            for (const uid of allPlayerUserIds) {
                const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, uid)).limit(1);
                if (user) {
                    const emailData = matchResultsEmail(
                        user.name,
                        teamA?.name || 'Team A',
                        teamB?.name || 'Team B',
                        winnerTeam?.name || 'Completed',
                        `${score?.teamARuns || 0}/${score?.teamAWickets || 0}`,
                        `${score?.teamBRuns || 0}/${score?.teamBWickets || 0}`,
                        motmName
                    );
                    emailData.to = user.email;
                    await sendEmail(emailData);
                }
            }
        } catch (emailErr) {
            console.error('Failed to send match completion emails:', emailErr);
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

            // Send notification emails
            try {
                const [teamA] = allTeams.filter(t => t.id === match.teamAId);
                const [teamB] = allTeams.filter(t => t.id === match.teamBId);

                const teamAPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamA.id));
                const teamBPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamB.id));
                const playerUserIds = [...teamAPlayers, ...teamBPlayers].map(p => p.userId);

                for (const uid of playerUserIds) {
                    const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, uid)).limit(1);
                    if (user) {
                        const emailData = matchScheduledEmail(user.name, teamA.name, teamB.name, match.date, match.time, match.venue);
                        emailData.to = user.email;
                        await sendEmail(emailData);
                    }
                }
            } catch (emailErr) {
                console.error('Failed to send auto-generate match emails:', emailErr);
            }
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

export async function sendMatchReminders(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const [match] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);

        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        const [teamA] = await db.select().from(teams).where(eq(teams.id, match.teamAId)).limit(1);
        const [teamB] = await db.select().from(teams).where(eq(teams.id, match.teamBId)).limit(1);

        if (!teamA || !teamB) {
            res.status(404).json({ error: 'Teams not found' });
            return;
        }

        const teamAPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamA.id));
        const teamBPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamB.id));
        const playerUserIds = [...teamAPlayers, ...teamBPlayers].map(p => p.userId);

        // Determine reminder type from date logic
        const matchDate = new Date(match.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchDate.setHours(0, 0, 0, 0);

        const diffTime = matchDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isMatchDay = diffDays === 0;

        for (const uid of playerUserIds) {
            const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, uid)).limit(1);
            if (user) {
                const emailData = preMatchReminderEmail(
                    user.name,
                    teamA.name,
                    teamB.name,
                    match.date,
                    match.time,
                    match.venue,
                    isMatchDay
                );
                emailData.to = user.email;
                await sendEmail(emailData);
            }
        }

        res.json({ message: `Reminders sent for ${isMatchDay ? 'Match Day' : 'Tomorrow'}` });
    } catch (error) {
        console.error('Send reminder error:', error);
        res.status(500).json({ error: 'Failed to send reminders' });
    }
}

export async function sendMatchResultsManual(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const [match] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);

        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        const [teamA] = await db.select().from(teams).where(eq(teams.id, match.teamAId)).limit(1);
        const [teamB] = await db.select().from(teams).where(eq(teams.id, match.teamBId)).limit(1);
        const [winnerTeam] = match.winnerTeamId ? await db.select().from(teams).where(eq(teams.id, match.winnerTeamId)).limit(1) : [null];
        const [score] = await db.select().from(scores).where(eq(scores.matchId, id)).limit(1);

        let motmName = 'N/A';
        if (match.manOfTheMatch) {
            const [p] = await db.select().from(players).where(eq(players.id, match.manOfTheMatch)).limit(1);
            if (p) {
                const [u] = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
                motmName = u?.name || 'N/A';
            }
        }

        const teamAPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, match.teamAId));
        const teamBPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, match.teamBId));
        const allPlayerUserIds = [...teamAPlayers, ...teamBPlayers].map(p => p.userId);

        for (const uid of allPlayerUserIds) {
            const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, uid)).limit(1);
            if (user) {
                const emailData = matchResultsEmail(
                    user.name,
                    teamA?.name || 'Team A',
                    teamB?.name || 'Team B',
                    winnerTeam?.name || 'Completed',
                    `${score?.teamARuns || 0}/${score?.teamAWickets || 0}`,
                    `${score?.teamBRuns || 0}/${score?.teamBWickets || 0}`,
                    motmName
                );
                emailData.to = user.email;
                await sendEmail(emailData);
            }
        }

        res.json({ message: 'Results email sent to all players' });
    } catch (error) {
        console.error('Send manual results error:', error);
        res.status(500).json({ error: 'Failed to send results' });
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
        const matchId = req.params.matchId as string;
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
            totalCatches: players.totalCatches, teamToken: players.teamToken,
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
        const id = req.params.id as string;
        const baseStats = await db.select().from(matchPlayerStats).where(eq(matchPlayerStats.matchId, id));

        const hydratedStats = await Promise.all(baseStats.map(async (stat) => {
            const playerRecs = await db.select().from(players).where(eq(players.id, stat.playerId)).limit(1);
            const player = playerRecs[0];
            let playerName = 'Unknown Player';
            let playerRole = 'Batsman';
            let profileImage = null;

            if (player) {
                const userRecs = await db.select().from(users).where(eq(users.id, player.userId)).limit(1);
                playerName = userRecs[0]?.name || 'Unknown User';
                playerRole = player.role || 'Batsman';
                profileImage = player.profileImage;
            }

            return {
                ...stat,
                playerName,
                playerRole,
                profileImage
            };
        }));

        res.json(hydratedStats);
    } catch (error: any) {
        console.error('[getMatchPlayerStats] Critical failure:', error);
        res.status(500).json({ error: 'Failed' });
    }
}

export async function updateMatchPlayerStats(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const { stats } = req.body; // Array of stat objects

        // Delete existing and insert new
        await db.delete(matchPlayerStats).where(eq(matchPlayerStats.matchId, id));

        if (stats && stats.length > 0) {
            const inserts: any[] = [];

            for (const s of stats) {
                let teamId = s.teamId;

                // If teamId is missing, try to find it from the player record
                if (!teamId) {
                    const [p] = await db.select({ teamId: players.teamId }).from(players).where(eq(players.id, s.playerId)).limit(1);
                    teamId = p?.teamId;
                }

                // Skip if we still don't have a teamId (shouldn't happen for valid match players)
                if (!teamId) {
                    console.warn(`[updateMatchPlayerStats] Skipping player ${s.playerId} because no teamId was found.`);
                    continue;
                }

                inserts.push({
                    matchId: id,
                    playerId: s.playerId,
                    teamId: teamId,
                    runsScored: s.runsScored || 0,
                    ballsFaced: s.ballsFaced || 0,
                    fours: s.fours || 0,
                    sixes: s.sixes || 0,
                    wickets: s.wickets || 0,
                    runsConceded: s.runsConceded || 0,
                    ballsBowled: s.ballsBowled || 0,
                    catches: s.catches || 0,
                });
            }

            if (inserts.length > 0) {
                try {
                    await db.insert(matchPlayerStats).values(inserts);
                } catch (insertError: any) {
                    console.error('[updateMatchPlayerStats] Batch insert failed, trying one-by-one:', insertError.message);
                    // Fallback: try inserting one by one
                    for (const ins of inserts) {
                        try {
                            await db.insert(matchPlayerStats).values(ins);
                        } catch (singleError: any) {
                            console.warn(`[updateMatchPlayerStats] Skipping player ${ins.playerId}:`, singleError.message);
                        }
                    }
                }
            }

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

/**
 * Create a final match with top 2 teams
 * Automatically selects the top 2 teams from the points table
 */
export async function createFinalMatch(req: Request, res: Response): Promise<void> {
    try {
        const { date, time, venue } = req.body;

        if (!date || !time || !venue) {
            res.status(400).json({ error: 'Date, time, and venue are required' });
            return;
        }

        // Get top 2 teams from points table (sorted by points DESC, then NRR DESC)
        const topTeams = await db
            .select({
                teamId: pointsTable.teamId,
                points: pointsTable.points,
                nrr: pointsTable.nrr,
            })
            .from(pointsTable)
            .orderBy(pointsTable.points, pointsTable.nrr)
            .limit(2);

        if (topTeams.length < 2) {
            res.status(400).json({ error: 'Need at least 2 teams in the tournament' });
            return;
        }

        const teamAId = topTeams[0].teamId;
        const teamBId = topTeams[1].teamId;

        // Check if final match already exists
        const existingFinal = await db
            .select()
            .from(matches)
            .where(eq(matches.matchType, 'final'))
            .limit(1);

        if (existingFinal.length > 0) {
            res.status(400).json({ error: 'Final match already exists' });
            return;
        }

        // Get tournament settings for overs
        const [settings] = await db.select().from(tournamentSettings).limit(1);
        const overs = settings?.defaultOvers || 20;

        // Create final match
        const [finalMatch] = await db.insert(matches).values({
            teamAId,
            teamBId,
            overs,
            date,
            time,
            venue,
            matchType: 'final',
            status: 'upcoming',
        }).returning();

        // Create score entry
        await db.insert(scores).values({ matchId: finalMatch.id });

        // Get team details for email
        const [teamA] = await db.select().from(teams).where(eq(teams.id, teamAId)).limit(1);
        const [teamB] = await db.select().from(teams).where(eq(teams.id, teamBId)).limit(1);

        // Send emails to all players
        if (teamA && teamB) {
            const teamAPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamA.id));
            const teamBPlayers = await db.select({ userId: players.userId }).from(players).where(eq(players.teamId, teamB.id));
            const allPlayerUserIds = [...teamAPlayers, ...teamBPlayers].map(p => p.userId);

            for (const uid of allPlayerUserIds) {
                const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
                if (user) {
                    const emailData = finalMatchEmail(user.name, teamA.name, teamB.name, date, time, venue);
                    emailData.to = user.email;
                    await sendEmail(emailData);
                }
            }
        }

        res.status(201).json({
            message: 'Final match created successfully',
            match: finalMatch,
            teamA: { id: teamA?.id, name: teamA?.name, points: topTeams[0].points },
            teamB: { id: teamB?.id, name: teamB?.name, points: topTeams[1].points },
        });
    } catch (error) {
        console.error('Create final match error:', error);
        res.status(500).json({ error: 'Failed to create final match' });
    }
}

/**
 * Get the final match (if exists and completed)
 */
export async function getFinalMatch(req: Request, res: Response): Promise<void> {
    try {
        const [finalMatch] = await db
            .select()
            .from(matches)
            .where(eq(matches.matchType, 'final'))
            .limit(1);

        if (!finalMatch) {
            res.status(404).json({ error: 'Final match not created yet' });
            return;
        }

        const [teamA] = await db.select().from(teams).where(eq(teams.id, finalMatch.teamAId)).limit(1);
        const [teamB] = await db.select().from(teams).where(eq(teams.id, finalMatch.teamBId)).limit(1);
        const [score] = await db.select().from(scores).where(eq(scores.matchId, finalMatch.id)).limit(1);

        let winner = null;
        if (finalMatch.winnerTeamId) {
            const [winnerTeam] = await db.select().from(teams).where(eq(teams.id, finalMatch.winnerTeamId)).limit(1);
            winner = winnerTeam;
        }

        res.json({
            match: finalMatch,
            teamA,
            teamB,
            score,
            winner,
            isTournamentComplete: finalMatch.status === 'completed' && winner,
        });
    } catch (error) {
        console.error('Get final match error:', error);
        res.status(500).json({ error: 'Failed to fetch final match' });
    }
}
