import { db } from './src/db/index.js';
import { pointsTable, teams } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function check() {
    const table = await db.select().from(pointsTable);
    for (const row of table) {
        const [team] = await db.select().from(teams).where(eq(teams.id, row.teamId)).limit(1);
        console.log(`${team?.name} (${team?.id}): P=${row.matchesPlayed} W=${row.wins} L=${row.losses} PTS=${row.points} NRR=${row.nrr} | Scored: ${row.totalRunsScored} in ${row.totalOversPlayed} | Conceded: ${row.totalRunsConceded} in ${row.totalOversBowled}`);
    }
    process.exit(0);
}

check();
