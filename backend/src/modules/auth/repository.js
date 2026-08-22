import pool from '../../database/connection.js';

export async function createUser(name, email, phone, passwordHash) {
  const result = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, phone, status, is_verified, created_at`,
    [name, email, phone, passwordHash]
  );
  return result.rows[0];
}

export async function getUserById(id) {
  const result = await pool.query(
    `SELECT id, name, email, phone, status, is_verified, created_at, last_login_at, token_version 
     FROM users 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function updateUserProfileDetails(id, name, phone) {
  await pool.query(
    `UPDATE users 
     SET name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3`,
    [name, phone, id]
  );
}

export async function incrementTokenVersion(userId) {
  await pool.query(
    `UPDATE users SET token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [userId]
  );
}

export async function getUserByIdentifier(identifier) {
  // Support both email or phone as login identifier
  const result = await pool.query(
    `SELECT id, name, email, phone, password_hash, status, is_verified, created_at, token_version 
     FROM users 
     WHERE email = $1 OR phone = $1`,
    [identifier]
  );
  return result.rows[0];
}

export async function getUserRoles(userId) {
  const result = await pool.query(
    `SELECT role FROM user_roles WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map(row => row.role);
}

export async function checkUserExistsByEmailOrPhone(email, phone) {
  const result = await pool.query(
    `SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2`,
    [email, phone]
  );
  return result.rows;
}

export async function getBloodGroupById(id) {
  const result = await pool.query(
    `SELECT id, code, name FROM blood_groups WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function addRole(userId, role, client = pool) {
  await client.query(
    `INSERT INTO user_roles (user_id, role) 
     VALUES ($1, $2) 
     ON CONFLICT (user_id, role) DO NOTHING`,
    [userId, role]
  );
}

export async function createDonorProfile(userId, bloodGroupId, dateOfBirth, gender, phone, address, area, district, state, pincode, client = pool) {
  const result = await client.query(
    `INSERT INTO donor_profiles (user_id, blood_group_id, date_of_birth, gender, phone, address, area, district, state, pincode) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
     ON CONFLICT (user_id) DO NOTHING
     RETURNING id`,
    [userId, bloodGroupId, dateOfBirth, gender, phone || null, address, area, district, state, pincode]
  );
  return result.rows[0];
}

export async function createReceiverProfile(userId, name, phone, address, area, district, state, pincode, receiverType, client = pool) {
  const result = await client.query(
    `INSERT INTO receiver_profiles (user_id, name, phone, address, area, district, state, pincode, receiver_type) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     ON CONFLICT (user_id) DO NOTHING
     RETURNING id`,
    [userId, name, phone, address, area, district, state, pincode, receiverType]
  );
  return result.rows[0];
}

export async function updateLastLogin(userId) {
  await pool.query(
    `UPDATE users 
     SET first_login_at = COALESCE(first_login_at, CURRENT_TIMESTAMP),
         last_login_at = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [userId]
  );
}

export async function getUserPasswordHash(userId) {
  const result = await pool.query(
    `SELECT password_hash FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0]?.password_hash;
}

export async function updateUserPassword(userId, passwordHash) {
  await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [passwordHash, userId]
  );
}

export async function invalidateUserResetTokens(userId) {
  await pool.query(
    `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );
}

export async function createResetToken(userId, tokenHash, expiresAt) {
  const result = await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

export async function getActiveResetToken(tokenHash) {
  const result = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP AND used_at IS NULL`,
    [tokenHash]
  );
  return result.rows[0];
}

export async function markResetTokenAsUsed(tokenId) {
  await pool.query(
    `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [tokenId]
  );
}

export async function getUserVerification(userId) {
  const result = await pool.query(
    `SELECT * FROM user_verifications WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

export async function upsertUserVerification(userId, method, otpHash, expiresAt, cooldownUntil) {
  await pool.query(
    `INSERT INTO user_verifications (user_id, method, otp_hash, expires_at, cooldown_until)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE
     SET method = EXCLUDED.method,
         otp_hash = EXCLUDED.otp_hash,
         expires_at = EXCLUDED.expires_at,
         attempts = 0,
         sent_at = CURRENT_TIMESTAMP,
         cooldown_until = EXCLUDED.cooldown_until`,
    [userId, method, otpHash, expiresAt, cooldownUntil]
  );
}

export async function incrementVerificationAttempts(userId) {
  const result = await pool.query(
    `UPDATE user_verifications 
     SET attempts = attempts + 1 
     WHERE user_id = $1 
     RETURNING attempts`,
    [userId]
  );
  return result.rows[0]?.attempts;
}

export async function deleteUserVerification(userId) {
  await pool.query(
    `DELETE FROM user_verifications WHERE user_id = $1`,
    [userId]
  );
}

export async function setUserVerified(userId) {
  await pool.query(
    `UPDATE users SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [userId]
  );
}
