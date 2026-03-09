import 'dotenv/config';
import postgres from 'postgres';

async function deepDiagnose() {
    const connStr = process.env.DATABASE_URL!;
    console.log('URL:', connStr.replace(/:[^@]+@/, ':***@'));

    const sql = postgres(connStr, { prepare: false });

    try {
        // Check database name & search_path
        const db = await sql`SELECT current_database(), current_schema(), version()`;
        console.log('Database:', db[0].current_database);
        console.log('Schema:', db[0].current_schema);

        // List ALL schemas
        const schemas = await sql`SELECT schema_name FROM information_schema.schemata`;
        console.log('Schemas:', schemas.map(s => s.schema_name));

        // Check if there are players tables in different schemas
        const playerTables = await sql`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'players'
        `;
        console.log('Players tables found:', playerTables);

        // Try raw SQL query with explicit schema
        console.log('\nTrying: SELECT * FROM public.players LIMIT 1...');
        try {
            const r = await sql`SELECT * FROM public.players LIMIT 1`;
            console.log('Success! Columns:', Object.keys(r.columns || {}));
            console.log('Row:', r[0]);
        } catch (e: any) {
            console.log('Failed:', e.message);
        }

        // Try the exact problematic query
        console.log('\nTrying the exact failing query...');
        try {
            const r = await sql.unsafe('select "id", "user_id", "batch", "team_id", "profile_image", "bio", "is_captain", "status", "team_token", "jersey_number", "player_role", "total_runs", "total_wickets", "matches_played", "total_balls_faced", "total_balls_bowled", "total_runs_conceded", "total_sixes", "total_fours", "total_catches", "created_at" from "players"');
            console.log('✅ Query works! Rows:', r.length);
        } catch (e: any) {
            console.log('❌ Query failed:', e.message);

            // If it fails, check what columns actually exist via pg_catalog
            console.log('\nChecking pg_catalog.pg_attribute...');
            const attrs = await sql`
                SELECT a.attname, a.attnum, t.typname
                FROM pg_catalog.pg_attribute a
                JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
                JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
                JOIN pg_catalog.pg_type t ON a.atttypid = t.oid
                WHERE c.relname = 'players' 
                AND n.nspname = 'public'
                AND a.attnum > 0 
                AND NOT a.attisdropped
                ORDER BY a.attnum
            `;
            console.log('pg_catalog columns:');
            attrs.forEach(a => console.log(`  ${a.attnum}: ${a.attname} (${a.typname})`));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.end();
    }
}

deepDiagnose();
