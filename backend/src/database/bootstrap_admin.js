import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from './connection.js';

async function bootstrap() {
  console.log('Starting Administrator bootstrap process...');

  const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Developer Admin';
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@gift-of-life.org';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'AdminPass123!';
  const phone = process.env.BOOTSTRAP_ADMIN_PHONE || '9999999999';

  console.log(`Configured Email: ${email}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if user already exists
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      console.log(`User ${email} already exists. Re-updating password & active status.`);
      const passwordHash = await bcrypt.hash(password, 10);
      await client.query(
        `UPDATE users 
         SET name = $1, phone = $2, password_hash = $3, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4`,
        [name, phone, passwordHash, userId]
      );
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const insertRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')
         RETURNING id`,
        [name, email, phone, passwordHash]
      );
      userId = insertRes.rows[0].id;
      console.log(`Created new user with ID: ${userId}`);
    }

    // 2. Add SUPER_ADMIN role
    await client.query(
      `INSERT INTO user_roles (user_id, role)
       VALUES ($1, 'SUPER_ADMIN')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [userId]
    );

    // 3. Add to audit log
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'BOOTSTRAP_ADMIN', 'USER', $1, $2)`,
      [userId, JSON.stringify({ email, name })]
    );

    await client.query('COMMIT');
    console.log('Administrator bootstrap completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bootstrap failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

bootstrap();
