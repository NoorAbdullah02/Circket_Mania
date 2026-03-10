import { db } from './src/db/index.js';
import { pointsTable, teams, matches, scores } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function check() {
    try {
        const pt = await db.select().from(pointsTable);
        console.log('--- POINTS TABLE ---');
        for (const row of pt) {
            const [team] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, row.teamId)).limit(1);
            console.log(`${team?.name} | pts: ${row.points} | nrr: ${row.nrr.toFixed(3)} | scored: ${row.totalRunsScored}/${row.totalOversPlayed} | conceded: ${row.totalRunsConceded}/${row.totalOversBowled}`);
        }

        const m = await db.select().from(matches).where(eq(matches.status, 'completed'));
        console.log('\n--- COMPLETED MATCHES ---');
        for (const match of m) {
            const [score] = await db.select().from(scores).where(eq(scores.matchId, match.id)).limit(1);
            const [tA] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, match.teamAId)).limit(1);
            const [tB] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, match.teamBId)).limit(1);
            console.log(`Match ${match.id}: ${tA?.name} vs ${tB?.name} | Winner: ${match.winnerTeamId === match.teamAId ? tA?.name : tB?.name}`);
            console.log(`Score: A ${score?.teamARuns}/${score?.teamAWickets} (${score?.teamAOversPlayed}) | B ${score?.teamBRuns}/${score?.teamBWickets} (${score?.teamBOversPlayed}) | Match Overs: ${match.overs}`);
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
