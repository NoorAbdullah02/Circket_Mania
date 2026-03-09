import 'dotenv/config';
import postgres from 'postgres';

async function checkAndFixColumns() {
    const connStr = process.env.DATABASE_URL!;
    const sql = postgres(connStr, { prepare: false });

    try {
        console.log('Checking matches table columns...\n');

        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'matches'
            ORDER BY ordinal_position
        `;

        console.log('Current matches table columns:');
        columns.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
        console.log('\n');

        // Try to add the missing column
        const missingColumns = [
            'scoreboard_image',
        ];

        for (const colName of missingColumns) {
            const exists = columns.some(c => c.column_name === colName);
            if (!exists) {
                console.log(`Adding missing column: ${colName}`);
                try {
                    await sql.unsafe(`ALTER TABLE matches ADD COLUMN scoreboard_image text`);
                    console.log(`✅ Successfully added ${colName}`);
                } catch (e: any) {
                    console.log(`⚠️ Error adding ${colName}: ${e.message}`);
                }
            }
        }

        await sql.end();
    } catch (error) {
        console.error('Error:', error);
        await sql.end();
        process.exit(1);
    }
}

checkAndFixColumns();
