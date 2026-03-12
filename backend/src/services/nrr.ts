import { db } from '../db/index.js';
import { matches, scores, pointsTable, teams } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Convert cricket overs format (e.g., 19.5) to decimal format
 * 
 * In cricket:
 * - 19.5 overs = 19 complete overs + 5 balls (out of 6 balls per over)
 * - 19.5 → 19 + (5/6) = 19.8333...
 * 
 * @param overs - Overs in cricket format (e.g., "19.5", "18.2")
 * @returns Decimal overs (e.g., 19.8333, 18.3333)
 * 
 * @example
 * oversToDecimal("19.5") // Returns 19.8333333333
 * oversToDecimal("18.2") // Returns 18.3333333333
 * oversToDecimal("20.0") // Returns 20.0
 */
export function oversToDecimal(overs: number | string | null | undefined): number {
    if (!overs && overs !== 0) return 0;

    const oversNum = typeof overs === 'string' ? parseFloat(overs) : overs;

    if (isNaN(oversNum) || oversNum < 0) return 0;

    const completedOvers = Math.floor(oversNum);
    const balls = Math.round((oversNum - completedOvers) * 10); // Extract decimal part and round to nearest ball

    // Validate balls (0-5, since 6 balls = 1 over)
    if (balls > 5) {
        console.warn(`Invalid balls value: ${balls} from overs ${oversNum}. Clamping to 5.`);
    }

    const validBalls = Math.min(balls, 5);
    const decimalOvers = completedOvers + validBalls / 6;

    return parseFloat(decimalOvers.toFixed(6)); // Keep 6 decimal places for internal calculations
}

/**
 * Interface for team statistics in a tournament
 */
interface TeamStats {
    totalRunsScored: number;
    totalOversPlayed: number;
    totalRunsConceded: number;
    totalOversBowled: number;
    matchesCompleted: number;
}

/**
 * Get all completed matches for a specific team
 * 
 * @param teamId - Team UUID
 * @returns Array of completed matches with scores
 */
async function getTeamCompletedMatches(teamId: string) {
    const teamMatches = await db
        .select()
        .from(matches)
        .where(
            and(
                eq(matches.status, 'completed'),
                (m) => (m.teamAId.equals(teamId) | m.teamBId.equals(teamId))
            )
        )
        .leftJoin(scores, eq(matches.id, scores.matchId));

    return teamMatches;
}

/**
 * Calculate tournament-wide statistics for a team
 * 
 * @param teamId - Team UUID
 * @param matchQuota - Default overs for the tournament (e.g., 20, 10)
 * @returns Team statistics aggregated across all completed matches
 */
export async function calculateTeamStats(teamId: string, matchQuota: number = 20): Promise<TeamStats> {
    const completedMatches = await db
        .select({
            matchId: matches.id,
            teamAId: matches.teamAId,
            teamBId: matches.teamBId,
            allOutWickets: 10, // Standard all-out at 10 wickets
            // Scores (team as batting side)
            teamARuns: scores.teamARuns,
            teamBRuns: scores.teamBRuns,
            teamAWickets: scores.teamAWickets,
            teamBWickets: scores.teamBWickets,
            teamAOversPlayed: scores.teamAOversPlayed,
            teamBOversPlayed: scores.teamBOversPlayed,
        })
        .from(matches)
        .innerJoin(scores, eq(matches.id, scores.matchId))
        .where(
            and(
                eq(matches.status, 'completed'),
                (m) => (m.teamAId.equals(teamId) | m.teamBId.equals(teamId))
            )
        );

    const stats: TeamStats = {
        totalRunsScored: 0,
        totalOversPlayed: 0,
        totalRunsConceded: 0,
        totalOversBowled: 0,
        matchesCompleted: 0,
    };

    for (const match of completedMatches) {
        const isTeamA = match.teamAId === teamId;

        if (isTeamA) {
            // Team is batting first (Team A)
            const overtsFaced = match.teamAWickets >= match.allOutWickets
                ? matchQuota
                : oversToDecimal(match.teamAOversPlayed);

            stats.totalRunsScored += match.teamARuns || 0;
            stats.totalOversPlayed += overtsFaced;

            // Conceded runs while Team B was batting
            const oversBowled = match.teamBWickets >= match.allOutWickets
                ? matchQuota
                : oversToDecimal(match.teamBOversPlayed);

            stats.totalRunsConceded += match.teamBRuns || 0;
            stats.totalOversBowled += oversBowled;
        } else {
            // Team is batting second (Team B)
            const overtsFaced = match.teamBWickets >= match.allOutWickets
                ? matchQuota
                : oversToDecimal(match.teamBOversPlayed);

            stats.totalRunsScored += match.teamBRuns || 0;
            stats.totalOversPlayed += overtsFaced;

            // Conceded runs while Team A was batting
            const oversBowled = match.teamAWickets >= match.allOutWickets
                ? matchQuota
                : oversToDecimal(match.teamAOversPlayed);

            stats.totalRunsConceded += match.teamARuns || 0;
            stats.totalOversBowled += oversBowled;
        }

        stats.matchesCompleted++;
    }

    return stats;
}

/**
 * Calculate Net Run Rate (NRR) based on complete tournament statistics
 * 
 * Formula:
 * NRR = (Total Runs Scored / Total Overs Played) - (Total Runs Conceded / Total Overs Bowled)
 * 
 * @param stats - Team statistics object
 * @returns NRR rounded to 3 decimal places
 * @throws Error if overs are 0 (no matches played)
 * 
 * @example
 * const stats = { totalRunsScored: 500, totalOversPlayed: 50, totalRunsConceded: 450, totalOversBowled: 50 };
 * calculateNRR(stats); // Returns +1.0
 */
export function calculateNRR(stats: TeamStats): number {
    // Validation
    if (stats.totalOversPlayed === 0 || stats.totalOversBowled === 0) {
        console.warn('Cannot calculate NRR: team has no completed matches');
        return 0;
    }

    const runsRate = stats.totalRunsScored / stats.totalOversPlayed;
    const concededRate = stats.totalRunsConceded / stats.totalOversBowled;
    const nrr = runsRate - concededRate;

    // Round to 3 decimal places for storage
    return parseFloat(nrr.toFixed(3));
}

/**
 * Update NRR for a specific team in the Points Table
 * 
 * This function:
 * 1. Calculates tournament-wide statistics
 * 2. Computes NRR
 * 3. Updates the points_table record
 * 
 * @param teamId - Team UUID
 * @param matchQuota - Default overs for the tournament
 * @returns Updated NRR value or 0 if no matches
 */
export async function updateTeamNRR(teamId: string, matchQuota: number = 20): Promise<number> {
    try {
        // Step 1: Calculate team statistics
        const stats = await calculateTeamStats(teamId, matchQuota);

        // Step 2: Calculate NRR
        const nrr = calculateNRR(stats);

        // Step 3: Update Points Table
        await db
            .update(pointsTable)
            .set({ nrr })
            .where(eq(pointsTable.teamId, teamId));

        console.log(`✅ NRR updated for team ${teamId}: ${nrr.toFixed(3)}`);
        return nrr;
    } catch (error) {
        console.error(`❌ Error updating NRR for team ${teamId}:`, error);
        throw error;
    }
}

/**
 * Recalculate NRR for all teams after a match is completed
 * 
 * This should be called whenever a match status changes to "completed"
 * 
 * @param matchId - Match UUID (optional, for logging)
 * @param matchQuota - Default overs for the tournament
 * @returns Array of teams with updated NRR values
 */
export async function recalculateAllTeamsNRR(matchId?: string, matchQuota: number = 20): Promise<Array<{ teamId: string; nrr: number }>> {
    try {
        // Get all teams
        const allTeams = await db.select({ id: teams.id }).from(teams);

        const results: Array<{ teamId: string; nrr: number }> = [];

        // Update NRR for each team
        for (const team of allTeams) {
            const nrr = await updateTeamNRR(team.id, matchQuota);
            results.push({ teamId: team.id, nrr });
        }

        console.log(`✅ NRR recalculated for all ${results.length} teams` + (matchId ? ` after match ${matchId}` : ''));
        return results;
    } catch (error) {
        console.error('❌ Error recalculating NRR for all teams:', error);
        throw error;
    }
}

/**
 * Get detailed NRR breakdown for a team (for display/debugging)
 * 
 * @param teamId - Team UUID
 * @param matchQuota - Default overs for the tournament
 * @returns Detailed NRR calculation breakdown
 */
export async function getTeamNRRBreakdown(
    teamId: string,
    matchQuota: number = 20
): Promise<{
    teamId: string;
    totalRunsScored: number;
    totalOversPlayed: number;
    scoringRate: number;
    totalRunsConceded: number;
    totalOversBowled: number;
    concedingRate: number;
    nrr: number;
    matchesCompleted: number;
}> {
    const stats = await calculateTeamStats(teamId, matchQuota);
    const nrr = calculateNRR(stats);

    return {
        teamId,
        totalRunsScored: stats.totalRunsScored,
        totalOversPlayed: parseFloat(stats.totalOversPlayed.toFixed(2)),
        scoringRate: stats.totalOversPlayed > 0
            ? parseFloat((stats.totalRunsScored / stats.totalOversPlayed).toFixed(2))
            : 0,
        totalRunsConceded: stats.totalRunsConceded,
        totalOversBowled: parseFloat(stats.totalOversBowled.toFixed(2)),
        concedingRate: stats.totalOversBowled > 0
            ? parseFloat((stats.totalRunsConceded / stats.totalOversBowled).toFixed(2))
            : 0,
        nrr,
        matchesCompleted: stats.matchesCompleted,
    };
}
