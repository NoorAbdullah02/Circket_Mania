import 'dotenv/config';
import { db } from './src/db/index.js';
import { teams, users, players } from './src/db/schema.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Cricket-style South Asian names for realistic squads
const extraPlayers: Record<string, { name: string; role: string; jersey: number }[]> = {
    'BUBT': [
        { name: 'Shakib Hasan', role: 'All-Rounder', jersey: 75 },
        { name: 'Tamim Iqbal', role: 'Batsman', jersey: 28 },
        { name: 'Mushfiqur Rahim', role: 'Wicketkeeper', jersey: 15 },
        { name: 'Taskin Ahmed', role: 'Bowler', jersey: 36 },
        { name: 'Mustafizur Rahman', role: 'Bowler', jersey: 34 },
        { name: 'Litton Das', role: 'Batsman', jersey: 39 },
        { name: 'Mehidy Miraz', role: 'All-Rounder', jersey: 44 },
        { name: 'Shoriful Islam', role: 'Bowler', jersey: 51 },
        { name: 'Afif Hossain', role: 'Batsman', jersey: 66 },
    ],
    'BAUET': [
        { name: 'Mashrafe Mortaza', role: 'Bowler', jersey: 14 },
        { name: 'Mahmudullah Riyad', role: 'All-Rounder', jersey: 30 },
        { name: 'Soumya Sarkar', role: 'Batsman', jersey: 22 },
        { name: 'Rubel Hossain', role: 'Bowler', jersey: 33 },
        { name: 'Nazmul Shanto', role: 'Batsman', jersey: 45 },
        { name: 'Ebadot Hossain', role: 'Bowler', jersey: 55 },
        { name: 'Nurul Hasan', role: 'Wicketkeeper', jersey: 42 },
        { name: 'Zakir Hasan', role: 'Batsman', jersey: 61 },
        { name: 'Hasan Mahmud', role: 'Bowler', jersey: 72 },
    ],
    'ICE Warriors': [
        { name: 'Arafat Sunny', role: 'Bowler', jersey: 11 },
        { name: 'Imrul Kayes', role: 'Batsman', jersey: 18 },
        { name: 'Mosaddek Hossain', role: 'All-Rounder', jersey: 25 },
        { name: 'Sabbir Rahman', role: 'Batsman', jersey: 32 },
        { name: 'Abu Jayed', role: 'Bowler', jersey: 47 },
        { name: 'Shuvagata Hom', role: 'All-Rounder', jersey: 52 },
        { name: 'Tanzid Hasan', role: 'Batsman', jersey: 59 },
        { name: 'Rishad Hossain', role: 'Bowler', jersey: 63 },
        { name: 'Jaker Ali', role: 'Wicketkeeper', jersey: 70 },
    ],
    'Cyber Strikers': [
        { name: 'Naeem Islam', role: 'All-Rounder', jersey: 13 },
        { name: 'Farhad Reza', role: 'Bowler', jersey: 19 },
        { name: 'Anamul Haque', role: 'Wicketkeeper', jersey: 26 },
        { name: 'Mominul Haque', role: 'Batsman', jersey: 35 },
        { name: 'Taijul Islam', role: 'Bowler', jersey: 41 },
        { name: 'Shaul Hasnat', role: 'Bowler', jersey: 48 },
        { name: 'Shamim Hossain', role: 'All-Rounder', jersey: 56 },
        { name: 'Mahmudul Joy', role: 'Batsman', jersey: 64 },
        { name: 'Akbar Ali', role: 'Wicketkeeper', jersey: 71 },
    ],
    'Tech Titans': [
        { name: 'Towhid Hridoy', role: 'Batsman', jersey: 12 },
        { name: 'Tanzim Sakib', role: 'Bowler', jersey: 21 },
        { name: 'Shahadat Hossain', role: 'Bowler', jersey: 29 },
        { name: 'Junaid Siddique', role: 'Batsman', jersey: 37 },
        { name: 'Syed Rasel', role: 'Bowler', jersey: 43 },
        { name: 'Nayeem Hasan', role: 'All-Rounder', jersey: 50 },
        { name: 'Aminul Islam', role: 'Batsman', jersey: 57 },
        { name: 'Mahdi Hasan', role: 'All-Rounder', jersey: 65 },
        { name: 'Parvez Rasool', role: 'Wicketkeeper', jersey: 73 },
    ],
    'Data Dragons': [
        { name: 'Shadman Islam', role: 'Batsman', jersey: 16 },
        { name: 'Kamrul Islam', role: 'Bowler', jersey: 23 },
        { name: 'Yasir Ali', role: 'All-Rounder', jersey: 31 },
        { name: 'Saif Hassan', role: 'Batsman', jersey: 38 },
        { name: 'Rejaur Rahman', role: 'Bowler', jersey: 46 },
        { name: 'Ariful Haque', role: 'All-Rounder', jersey: 53 },
        { name: 'Mithun Ali', role: 'Batsman', jersey: 60 },
        { name: 'Nasum Ahmed', role: 'Bowler', jersey: 67 },
        { name: 'Dhiman Ghosh', role: 'Wicketkeeper', jersey: 74 },
    ],
};

// Randomized demo profile images using DiceBear Avatars (always available, no API key needed)
function getProfileImage(name: string, index: number): string {
    const styles = ['adventurer', 'avataaars', 'big-ears', 'bottts', 'lorelei', 'micah', 'miniavs', 'open-peeps', 'personas', 'pixel-art'];
    const style = styles[index % styles.length];
    const seed = encodeURIComponent(name);
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=1a1a2e`;
}

async function seed() {
    console.log('🏏 Adding 9 more players to each team (11 total per team)...\n');

    const hashedPw = await bcrypt.hash('player123', 10);
    const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams);

    // Also update existing players with profile images
    const existingPlayers = await db.select({ id: players.id, userId: players.userId }).from(players);
    for (let i = 0; i < existingPlayers.length; i++) {
        const [user] = await db.select({ name: users.name }).from(users).where(
            (await import('drizzle-orm')).eq(users.id, existingPlayers[i].userId)
        );
        if (user) {
            const img = getProfileImage(user.name, i);
            await db.update(players).set({ profileImage: img }).where(
                (await import('drizzle-orm')).eq(players.id, existingPlayers[i].id)
            );
            console.log(`   📸 Updated profile image for ${user.name}`);
        }
    }

    let totalAdded = 0;

    for (const team of allTeams) {
        const teamExtras = extraPlayers[team.name];
        if (!teamExtras) {
            console.log(`   ⚠️  No extra players defined for ${team.name}, skipping`);
            continue;
        }

        console.log(`\n🏆 ${team.name}:`);

        for (let j = 0; j < teamExtras.length; j++) {
            const p = teamExtras[j];
            const email = p.name.toLowerCase().replace(/ /g, '.') + '@cricket.com';
            const userId = uuidv4();
            const profileImage = getProfileImage(p.name, j + totalAdded);

            await db.insert(users).values({
                id: userId,
                name: p.name,
                email,
                password: hashedPw,
                role: 'player',
                isActive: true,
            });

            await db.insert(players).values({
                userId,
                batch: '67',
                teamId: team.id,
                status: 'activated',
                jerseyNumber: p.jersey,
                role: p.role,
                isCaptain: false,
                profileImage,
            });

            console.log(`   ✅ ${p.name} - ${p.role} #${p.jersey}`);
            totalAdded++;
        }
    }

    // Verify
    const { eq } = await import('drizzle-orm');
    console.log('\n📊 Final squad sizes:');
    for (const team of allTeams) {
        const count = await db.select({ id: players.id }).from(players).where(eq(players.teamId, team.id));
        console.log(`   ${team.name}: ${count.length} players`);
    }

    console.log(`\n✅ Done! Added ${totalAdded} new players with profile images.`);
    process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
