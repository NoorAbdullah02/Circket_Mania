import { db } from './db/index';
import { recalculatePointsTable } from './controllers/matches';

async function fix() {
    await recalculatePointsTable();
    console.log("Points table fixed.");
    process.exit(0);
}

fix();
