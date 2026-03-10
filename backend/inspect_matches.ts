import { db } from './src/db/index.js';
import { matches, scores, teams } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function check() {
    const allMatches = await db.select().from(matches);
    for (const match of allMatches) {
        const [score] = await db.select().from(scores).where(eq(scores.matchId, match.id)).limit(1);
        const [teamA] = await db.select().from(teams).where(eq(teams.id, match.teamAId)).limit(1);
        const [teamB] = await db.select().from(teams).where(eq(teams.id, match.teamBId)).limit(1);
        console.log(`${match.status}: ${teamA?.name} vs ${teamB?.name} | Score: ${score?.teamARuns}/${score?.teamAWickets} (${score?.teamAOversPlayed}) vs ${score?.teamBRuns}/${score?.teamBWickets} (${score?.teamBOversPlayed}) | Overs: ${match.overs}`);
    }
    process.exit(0);
}

check();
