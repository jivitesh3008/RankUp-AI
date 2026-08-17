const postgres = require('postgres');
async function test() {
  try {
    const sql = postgres('postgres://postgres:postgres@localhost:54322/postgres');
    const res = await sql`SELECT 1`;
    console.log("Local connection works:", res);
    process.exit(0);
  } catch (e) {
    console.log("Local connection failed:", e.message);
    process.exit(1);
  }
}
test();
