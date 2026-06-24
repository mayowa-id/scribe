const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT_MACHINE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

async function clearUsers() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    // We should delete users. Note: foreign keys might exist!
    // We might need to cascade or delete dependent records first.
    // Let's just try cascading deletion, or standard delete.
    const res = await client.query('DELETE FROM users CASCADE');
    console.log(`Deleted ${res.rowCount} users.`);
    
  } catch (err) {
    console.error('Error clearing users:', err);
  } finally {
    await client.end();
  }
}

clearUsers();
