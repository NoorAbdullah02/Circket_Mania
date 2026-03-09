import 'dotenv/config';
import { db } from './src/db/index.js';
import { players } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function testSelect() {
    try {
        console.log('Testing select().from(players)...');
        const result = await db.select().from(players).limit(1);
        console.log('Result found:', !!result);
        process.exit(0);
    } catch (error) {
        console.error('Test Select Failed:', error);
        process.exit(1);
    }
}

testSelect();
