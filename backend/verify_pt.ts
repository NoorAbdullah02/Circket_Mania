import { db } from './src/db/index.js';
import { pointsTable, teams } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function check() {
    const pt = await db.select().from(pointsTable);
    for (const row of pt) {
        const [team] = await db.select().from(teams).where(eq(teams.id, row.teamId)).limit(1);
        const name = team?.name || 'Unknown';
        console.log(`${name} | P:${row.matchesPlayed} W:${row.wins} L:${row.losses} PTS:${row.points} NRR:${row.nrr.toFixed(3)} | Scored ${row.totalRunsScored} in ${row.totalOversPlayed} | Bowled ${row.totalRunsConceded} in ${row.totalOversBowled}`);
    }
    process.exit(0);
}

check();
