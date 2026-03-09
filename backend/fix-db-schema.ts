import 'dotenv/config';
import postgres from 'postgres';

async function fixDatabaseSchema() {
    const connStr = process.env.DATABASE_URL!;
    const sql = postgres(connStr, { prepare: false });

    try {
        console.log('🔧 Fixing database schema...\n');

        // Check and add missing columns in matches table
        const matchesColumns = [
            { name: 'scoreboard_image', type: 'text' },
        ];

        for (const col of matchesColumns) {
            const check = await sql`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'matches' AND column_name = ${col.name}
                )
            `;

            if (!check[0].exists) {
                console.log(`Adding missing ${col.name} column to matches table...`);
                await sql.unsafe(`ALTER TABLE matches ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ ${col.name} column added to matches\n`);
            } else {
                console.log(`ℹ️ ${col.name} column already exists in matches\n`);
            }
        }

        console.log('✅ Database schema fix complete!');
        await sql.end();
    } catch (error) {
        console.error('❌ Error fixing schema:', error);
        await sql.end();
        process.exit(1);
    }
}

fixDatabaseSchema();
