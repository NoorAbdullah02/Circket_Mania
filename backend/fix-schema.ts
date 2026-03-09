import 'dotenv/config';
import postgres from 'postgres';

async function fixSchema() {
    const connStr = process.env.DATABASE_URL!;
    const sql = postgres(connStr, { prepare: false });

    try {
        console.log('Checking and fixing database schema...');

        // Check if team_token column exists
        const columnCheck = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'players' AND column_name ='team_token'
            )
        `;

        if (!columnCheck[0].exists) {
            console.log('Adding missing team_token column...');
            await sql`ALTER TABLE players ADD COLUMN team_token varchar(20)`;
            console.log('✅ team_token column added');
        } else {
            console.log('ℹ️ team_token column already exists');
        }

        // Check other potentially missing columns
        const columns = [
            { name: 'jersey_number', type: 'integer' },
            { name: 'player_role', type: "varchar(50) DEFAULT 'Batsman'" },
            { name: 'total_runs', type: 'integer DEFAULT 0' },
            { name: 'total_wickets', type: 'integer DEFAULT 0' },
            { name: 'matches_played', type: 'integer DEFAULT 0' },
            { name: 'total_balls_faced', type: 'integer DEFAULT 0' },
            { name: 'total_balls_bowled', type: 'integer DEFAULT 0' },
            { name: 'total_runs_conceded', type: 'integer DEFAULT 0' },
            { name: 'total_sixes', type: 'integer DEFAULT 0' },
            { name: 'total_fours', type: 'integer DEFAULT 0' },
            { name: 'total_catches', type: 'integer DEFAULT 0' },
        ];

        for (const col of columns) {
            const check = await sql`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'players' AND column_name = ${col.name}
                )
            `;

            if (!check[0].exists) {
                console.log(`Adding missing ${col.name} column...`);
                await sql.unsafe(`ALTER TABLE players ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ ${col.name} column added`);
            }
        }

        console.log('✅ Schema needs are fixed!');
        await sql.end();
    } catch (error) {
        console.error('Error fixing schema:', error);
        await sql.end();
        process.exit(1);
    }
}

fixSchema();
