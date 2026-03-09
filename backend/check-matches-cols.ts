import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function checkColumns() {
    try {
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'matches'
            ORDER BY ordinal_position
        `);
        console.log('Matches table columns:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

checkColumns();
