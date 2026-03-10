import { db } from './src/db/index.js';
import { matches, scores, teams, pointsTable } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function check() {
    try {
        const pt = await db.select().from(pointsTable);
        for (const row of pt) {
            const [team] = await db.select().from(teams).where(eq(teams.id, row.teamId)).limit(1);
            console.log(`PT Row for ${team?.name}: Scored=${row.totalRunsScored}, Faced=${row.totalOversPlayed}, Conceded=${row.totalRunsConceded}, Bowled=${row.totalOversBowled}, NRR=${row.nrr}`);
        }

        const allMatches = await db.select().from(matches).where(eq(matches.status, 'completed'));
        for (const m of allMatches) {
            const [s] = await db.select().from(scores).where(eq(scores.matchId, m.id)).limit(1);
            const [tA] = await db.select().from(teams).where(eq(teams.id, m.teamAId)).limit(1);
            const [tB] = await db.select().from(teams).where(eq(teams.id, m.teamBId)).limit(1);
            console.log(`Match ${m.id}: ${tA?.name} vs ${tB?.name} | Winner: ${m.winnerTeamId}`);
            console.log(`Scores: A=${s?.teamARuns}/${s?.teamAWickets} in ${s?.teamAOversPlayed} | B=${s?.teamBRuns}/${s?.teamBWickets} in ${s?.teamBOversPlayed}`);
        }
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

check();
