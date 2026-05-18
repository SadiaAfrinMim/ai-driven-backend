const fs = require('fs');
const { Client } = require('pg');

(async () => {
  try {
    const envPath = './.env';
    if (!fs.existsSync(envPath)) {
      console.error(JSON.stringify({ success: false, error: '.env not found at ' + envPath }));
      process.exit(1);
    }
    const env = fs.readFileSync(envPath, 'utf8');
    const m = env.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
    if (!m) {
      console.error(JSON.stringify({ success: false, error: 'DATABASE_URL not found in .env' }));
      process.exit(1);
    }
    const connectionString = m[1];

    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Query approved items; if status column issues, try without WHERE
    let rows;
    try {
      const res = await client.query('SELECT * FROM "Item" WHERE status=$1 ORDER BY "createdAt" DESC LIMIT 100', ['APPROVED']);
      rows = res.rows;
    } catch (err) {
      const res = await client.query('SELECT * FROM "Item" ORDER BY "createdAt" DESC LIMIT 100');
      rows = res.rows;
    }

    console.log(JSON.stringify({ success: true, count: rows.length, items: rows }, null, 2));
    await client.end();
  } catch (e) {
    console.error(JSON.stringify({ success: false, error: e.message || String(e) }));
    process.exit(1);
  }
})();
