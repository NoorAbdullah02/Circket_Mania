import 'dotenv/config';
import { db } from './index.js';
import { tournamentSettings } from './schema.js';
import { seedAdmins, seedDemoPlayers } from '../utils/seed.js';

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Seed Tournament Settings
    const [existingSettings] = await db.select().from(tournamentSettings).limit(1);
    if (!existingSettings) {
        await db.insert(tournamentSettings).values({
            name: 'ICE Cricket Mania – Season 2',
            defaultOvers: 10,
            matchesPerTeam: 3,
            pointsPerWin: 2,
            pointsPerLoss: 0,
            pointsPerNoResult: 1,
            playersPerTeam: 11,
        });
        console.log('✅ Tournament settings created');
    }

    // 2. Seed Default Admins (Now handles updates internally)
    await seedAdmins();

    // 3. Seed demo players for each team
    await seedDemoPlayers();

    console.log('🌱 Seeding complete!');
    process.exit(0);
}

seed().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
