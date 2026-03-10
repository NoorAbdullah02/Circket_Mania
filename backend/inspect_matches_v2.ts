import { db } from './src/db/index.js';
import { matches, scores, teams } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function check() {
    try {
        const allMatches = await db.select({
            id: matches.id,
            teamAId: matches.teamAId,
            teamBId: matches.teamBId,
            status: matches.status,
            winnerTeamId: matches.winnerTeamId,
            overs: matches.overs
        }).from(matches);

        for (const match of allMatches) {
            const [score] = await db.select().from(scores).where(eq(scores.matchId, match.id)).limit(1);
            const [teamA] = await db.select().from(teams).where(eq(teams.id, match.teamAId)).limit(1);
            const [teamB] = await db.select().from(teams).where(eq(teams.id, match.teamBId)).limit(1);
            console.log(`Match ${match.id}: ${match.status}`);
            console.log(`Teams: ${teamA?.name} (ID: ${teamA?.id}) vs ${teamB?.name} (ID: ${teamB?.id})`);
            console.log(`Winner: ${match.winnerTeamId}`);
            console.log(`Score: TeamA Runs=${score?.teamARuns}, Wkts=${score?.teamAWickets}, Overs=${score?.teamAOversPlayed}`);
            console.log(`       TeamB Runs=${score?.teamBRuns}, Wkts=${score?.teamBWickets}, Overs=${score?.teamBOversPlayed}`);
            console.log(`Match Overs Quota: ${match.overs}`);
            console.log('---');
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
