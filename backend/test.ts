import 'dotenv/config';
import { db } from './src/db/index.js';
import { players } from './src/db/schema.js';

async function test() {
    try {
        console.log('Using DB URL:', process.env.DATABASE_URL);
        const allPlayers = await db.select().from(players);
        console.log('Success, found', allPlayers.length, 'players');
    } catch (err: any) {
        console.error('Failed!', err.message || err);
    }
    process.exit(0);
}

test();
