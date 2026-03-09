import 'dotenv/config';
import { players } from './src/db/schema.js';

console.log('Players table object keys:', Object.keys(players));
console.log('teamToken in players:', 'teamToken' in players);
console.log('teamToken column:', players.teamToken);
process.exit(0);
