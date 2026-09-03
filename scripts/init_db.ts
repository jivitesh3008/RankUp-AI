import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL!;
if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function run() {
  try {
    const migration = fs.readFileSync('supabase/009_chapter_notes_and_cleanup.sql', 'utf8');
    await sql.unsafe(migration);
    console.log("Migration 009 executed successfully!");
  } catch(e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}
run();
