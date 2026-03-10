import 'dotenv/config';
import { db } from './src/db/index.js';
import { teams, users, players, matches, scores, pointsTable, tournamentSettings } from './src/db/schema.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log('🌱 Starting fresh database seed...\n');

    // 1. Tournament Settings
    console.log('📋 Creating tournament settings...');
    await db.insert(tournamentSettings).values({
        name: 'ICE Cricket Mania – Season 2',
        defaultOvers: 5,
        matchesPerTeam: 3,
        pointsPerWin: 2,
        pointsPerLoss: 0,
        pointsPerNoResult: 1,
        playersPerTeam: 11,
        status: 'active',
    });

    // 2. Teams
    console.log('🏏 Creating teams...');
    const teamData = [
        { id: uuidv4(), name: 'BUBT', shortName: 'BUBT', color: '#ef4444' },
        { id: uuidv4(), name: 'BAUET', shortName: 'BAUET', color: '#3b82f6' },
        { id: uuidv4(), name: 'ICE Warriors', shortName: 'ICE', color: '#22c55e' },
        { id: uuidv4(), name: 'Cyber Strikers', shortName: 'CS', color: '#a855f7' },
        { id: uuidv4(), name: 'Tech Titans', shortName: 'TT', color: '#f59e0b' },
        { id: uuidv4(), name: 'Data Dragons', shortName: 'DD', color: '#06b6d4' },
    ];
    for (const t of teamData) {
        await db.insert(teams).values(t);
    }
    console.log(`   Created ${teamData.length} teams`);

    // 3. Users + Players (2 per team)
    console.log('👤 Creating users and players...');
    const hashedPw = await bcrypt.hash('password123', 10);
    const playerNames = [
        ['Noor Abdullah', 'Karim Hasan'],
        ['Rafiq Ahmed', 'Sohel Rana'],
        ['Tanvir Islam', 'Jahid Hossain'],
        ['Rafi Mahmud', 'Sajid Khan'],
        ['Imran Ali', 'Farhan Kabir'],
        ['Mehedi Hasan', 'Ashik Rahman'],
    ];

    for (let i = 0; i < teamData.length; i++) {
        for (let j = 0; j < playerNames[i].length; j++) {
            const name = playerNames[i][j];
            const email = name.toLowerCase().replace(/ /g, '.') + '@example.com';
            const userId = uuidv4();
            await db.insert(users).values({
                id: userId,
                name,
                email,
                password: hashedPw,
                role: 'player',
                isActive: true,
            });
            await db.insert(players).values({
                userId,
                batch: '67',
                teamId: teamData[i].id,
                status: 'activated',
                jerseyNumber: (j + 1) * 10,
                role: j === 0 ? 'All-Rounder' : 'Batsman',
                isCaptain: j === 0,
            });
        }
    }
    console.log('   Created 12 users + players');

    // 4. Create admin user
    console.log('🛡️  Creating admin user...');
    const adminPw = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
        name: 'Admin',
        email: 'admin@ice.com',
        password: adminPw,
        role: 'admin',
        isActive: true,
    });

    // 5. Create 1 completed match: BUBT vs BAUET (BUBT wins by scoring more)
    console.log('⚡ Creating completed match (BUBT 85/3 in 4.4 vs BAUET 72/5 in 5.0)...');
    const matchId = uuidv4();
    await db.insert(matches).values({
        id: matchId,
        teamAId: teamData[0].id, // BUBT
        teamBId: teamData[1].id, // BAUET
        overs: 5,
        date: '2026-03-10',
        time: '10:00 AM',
        venue: 'ICE Ground',
        status: 'completed',
        winnerTeamId: teamData[0].id, // BUBT wins
    });
    await db.insert(scores).values({
        matchId,
        teamARuns: 85,     // BUBT scored 85
        teamBRuns: 72,     // BAUET scored 72
        teamAWickets: 3,   // BUBT lost 3 wickets
        teamBWickets: 5,   // BAUET lost 5 wickets
        teamAOversPlayed: 4.4,  // 4 overs 4 balls
        teamBOversPlayed: 5.0,  // full 5 overs
    });

    // 6. Create 2 upcoming matches
    console.log('📅 Creating upcoming matches...');
    await db.insert(matches).values({
        teamAId: teamData[2].id, // ICE Warriors
        teamBId: teamData[3].id, // Cyber Strikers
        overs: 5,
        date: '2026-03-15',
        time: '2:00 PM',
        venue: 'ICE Ground',
        status: 'upcoming',
    });
    await db.insert(matches).values({
        teamAId: teamData[4].id, // Tech Titans
        teamBId: teamData[5].id, // Data Dragons
        overs: 5,
        date: '2026-03-16',
        time: '3:00 PM',
        venue: 'ICE Ground',
        status: 'upcoming',
    });

    // 7. Initialize points table for ALL teams
    console.log('📊 Initializing points table...');

    // BUBT: Won 1, scored 85 in 4.667 overs (4.4 cricket = 4+4/6), conceded 72 in 5 overs
    // NRR = (85/4.667) - (72/5) = 18.214 - 14.4 = +3.814
    const bubtOversDecimal = 4 + (4 / 6); // 4.667
    const bubtNrr = (85 / bubtOversDecimal) - (72 / 5);

    // BAUET: Lost 1, scored 72 in 5 overs, conceded 85 in 4.667 overs
    // NRR = (72/5) - (85/4.667) = 14.4 - 18.214 = -3.814
    const bauetNrr = (72 / 5) - (85 / bubtOversDecimal);

    for (const t of teamData) {
        if (t.name === 'BUBT') {
            await db.insert(pointsTable).values({
                teamId: t.id,
                matchesPlayed: 1,
                wins: 1,
                losses: 0,
                points: 2,
                nrr: parseFloat(bubtNrr.toFixed(3)),
                totalRunsScored: 85,
                totalOversPlayed: bubtOversDecimal,
                totalRunsConceded: 72,
                totalOversBowled: 5,
            });
        } else if (t.name === 'BAUET') {
            await db.insert(pointsTable).values({
                teamId: t.id,
                matchesPlayed: 1,
                wins: 0,
                losses: 1,
                points: 0,
                nrr: parseFloat(bauetNrr.toFixed(3)),
                totalRunsScored: 72,
                totalOversPlayed: 5,
                totalRunsConceded: 85,
                totalOversBowled: bubtOversDecimal,
            });
        } else {
            await db.insert(pointsTable).values({
                teamId: t.id,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                points: 0,
                nrr: 0,
                totalRunsScored: 0,
                totalOversPlayed: 0,
                totalRunsConceded: 0,
                totalOversBowled: 0,
            });
        }
    }

    console.log('\n✅ Seed complete! Summary:');
    console.log(`   Teams: ${teamData.length}`);
    console.log(`   Players: 12 (2 per team)`);
    console.log(`   Matches: 1 completed + 2 upcoming`);
    console.log(`   BUBT won vs BAUET: 85/3 in 4.4 overs vs 72/5 in 5.0 overs`);
    console.log(`   BUBT NRR: +${bubtNrr.toFixed(3)} (winner has POSITIVE NRR ✅)`);
    console.log(`   BAUET NRR: ${bauetNrr.toFixed(3)} (loser has NEGATIVE NRR ✅)`);

    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
