import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cricket_mania';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export default db;
