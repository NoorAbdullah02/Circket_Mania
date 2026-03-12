import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, players, teams } from '../db/schema.js';

export async function seedAdmins() {
    try {
        const admins = [
            {
                name: 'Admin One',
                email: 'admin1@noor.com',
                password: 'NoorAbdullah',
                role: 'admin' as const,
            },
            {
                name: 'Admin Two',
                email: 'admin2@noor.com',
                password: 'NoorAbdullah1',
                role: 'admin' as const,
            }
        ];

        for (const admin of admins) {
            const existing = await db.select().from(users).where(eq(users.email, admin.email)).limit(1);
            const hashedPassword = await bcrypt.hash(admin.password, 10);

            if (existing.length === 0) {
                await db.insert(users).values({
                    name: admin.name,
                    email: admin.email,
                    password: hashedPassword,
                    role: admin.role,
                    isActive: true,
                });
                console.log(`✅ Default admin created: ${admin.email}`);
            } else {
                // Update existing record to match requested credentials
                await db.update(users).set({
                    password: hashedPassword,
                    role: admin.role
                }).where(eq(users.email, admin.email));
                console.log(`✅ Default admin updated: ${admin.email}`);
            }
        }
    } catch (error) {
        console.error('❌ Error seeding admins:', error);
    }
}

export async function seedDemoPlayers() {
    try {
        // Get all teams
        const allTeams = await db.select().from(teams);
        
        if (allTeams.length === 0) {
            console.log('⚠️  No teams found. Skipping player seeding.');
            return;
        }

        const playerRoles = ['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'];
        const firstNames = [
            'Aditya', 'Bhavesh', 'Chetan', 'Dhruv', 'Eshan', 'Faizan', 'Gaurav', 'Harsh',
            'Ishaan', 'Jatin', 'Karan', 'Laxman', 'Mayank', 'Nikhil', 'Omer', 'Priyanshu',
            'Ravi', 'Sanjay', 'Tanmay', 'Uday', 'Varun', 'Waqar', 'Yash', 'Zain'
        ];
        const lastNames = [
            'Singh', 'Sharma', 'Patel', 'Kumar', 'Rao', 'Verma', 'Gupta', 'Nair',
            'Iyer', 'Malhotra', 'Chopra', 'Bannerjee', 'Desai', 'Yadav', 'Reddy', 'Khan'
        ];

        for (const team of allTeams) {
            // Check if team already has players
            const existingPlayers = await db.select().from(players).where(eq(players.teamId, team.id)).limit(1);
            
            if (existingPlayers.length > 0) {
                console.log(`⏭️  Team "${team.name}" already has players. Skipping.`);
                continue;
            }

            // Create 12 demo players for this team
            for (let i = 0; i < 12; i++) {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const playerName = `${firstName} ${lastName}`;
                const playerEmail = `${playerName.toLowerCase().replace(/\s+/g, '.')}.${team.name.toLowerCase().replace(/\s+/g, '')}@cricket.com`;
                const playerRole = playerRoles[Math.floor(Math.random() * playerRoles.length)];
                const isCaptain = i === 0; // First player is captain
                const jerseyNumber = i + 1;

                // Create user account for player
                const hashedPassword = await bcrypt.hash('Cricket@2024', 10);
                const userResult = await db.insert(users).values({
                    name: playerName,
                    email: playerEmail,
                    password: hashedPassword,
                    role: 'player',
                    isActive: true,
                }).returning({ id: users.id });

                const userId = userResult[0].id;

                // Create player record
                await db.insert(players).values({
                    userId,
                    batch: `2024-${i}`,
                    teamId: team.id,
                    profileImage: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
                    bio: `${playerRole} for ${team.name}`,
                    isCaptain,
                    status: 'activated',
                    jerseyNumber,
                    role: playerRole,
                    totalRuns: Math.floor(Math.random() * 500),
                    totalWickets: Math.floor(Math.random() * 20),
                    matchesPlayed: Math.floor(Math.random() * 10),
                    totalBallsFaced: Math.floor(Math.random() * 300),
                    totalBallsBowled: Math.floor(Math.random() * 250),
                    totalRunsConceded: Math.floor(Math.random() * 200),
                    totalSixes: Math.floor(Math.random() * 15),
                    totalFours: Math.floor(Math.random() * 30),
                    totalCatches: Math.floor(Math.random() * 10),
                });
            }

            console.log(`✅ Created 12 demo players for team "${team.name}"`);
        }
    } catch (error) {
        console.error('❌ Error seeding demo players:', error);
    }
}
