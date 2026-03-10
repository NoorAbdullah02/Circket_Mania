import 'dotenv/config';
import { db } from './src/db/index.js';
import { recalculatePointsTable } from './src/controllers/matches.js';

async function run() {
    console.log('Manually triggering recalculatePointsTable...');
    await recalculatePointsTable();
    console.log('Recalculation complete.');
    process.exit(0);
}

run();
