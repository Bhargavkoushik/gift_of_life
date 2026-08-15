import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection immediately on startup
pool.query('SELECT 1')
  .then(() => {
    console.log('database is connected');
  })
  .catch((err) => {
    console.error('database connection failed:', err.message);
  });

// Reusable connection query helper
export const query = (text, params) => pool.query(text, params);

export default pool;
