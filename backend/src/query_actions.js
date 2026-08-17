import dotenv from 'dotenv';
dotenv.config();

import pool from './database/connection.js';

async function main() {
  try {
    const res = await pool.query('SELECT DISTINCT action FROM audit_logs ORDER BY action ASC');
    console.log('DISTINCT ACTIONS:');
    console.log(res.rows.map(r => r.action));
    
    const countRes = await pool.query('SELECT COUNT(*) FROM audit_logs');
    console.log('TOTAL LOGS:', countRes.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
