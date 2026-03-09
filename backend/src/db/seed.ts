import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { db } from './index.js';
import { users, tournamentSettings } from './schema.js';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log('🌱 Seeding database...');

    const [existingAdmin] = await db.select().from(users).where(eq(users.email, 'admin@cricketmania.com')).limit(1);

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.insert(users).values({
            name: 'Admin',
            email: 'admin@cricketmania.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
        });
        console.log('✅ Admin account created (admin@cricketmania.com / admin123)');
    } else {
        console.log('ℹ️ Admin account already exists');
    }

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

    console.log('🌱 Seeding complete!');
    process.exit(0);
}

seed().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
