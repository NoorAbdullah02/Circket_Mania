import 'dotenv/config';
import postgres from 'postgres';

async function fixSchema() {
    const connStr = process.env.DATABASE_URL!;
    const sql = postgres(connStr, { prepare: false });

    try {
        console.log('Fixing matches table schema...');
        await sql.unsafe(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS scoreboard_image text`);
        console.log('✅ scoreboard_image column added to matches');
        
        // Also let's check for match_type in matches
        await sql.unsafe(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type varchar(50) DEFAULT 'league'`);
        console.log('✅ match_type column added to matches if not existed');

        await sql.end();
    } catch (error) {
        console.error('Error fixing schema:', error);
        await sql.end();
        process.exit(1);
    }
}

fixSchema();
