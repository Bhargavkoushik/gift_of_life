import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('Starting database migrations...');
  const client = await pool.connect();

  try {
    // 1. Create tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch already executed migrations
    const { rows } = await client.query('SELECT name FROM migrations ORDER BY id ASC');
    const executedMigrations = new Set(rows.map(row => row.name));

    // 3. Read migration directory
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('Migrations directory not found at', migrationsDir);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical/numeric order

    console.log(`Found ${files.length} migration file(s) in directory.`);

    for (const file of files) {
      if (executedMigrations.has(file)) {
        console.log(`Skipping already executed migration: ${file}`);
        continue;
      }

      console.log(`Executing migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Run each migration file in a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Migration completed successfully: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error executing migration ${file}, transaction rolled back.`);
        throw err;
      }
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration runner failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    // Close the pool so the node process can exit
    await pool.end();
  }
}

migrate();
