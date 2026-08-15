import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../../database/connection.js';
import * as authRepository from './repository.js';
import * as notificationService from '../../services/notificationService.js';

const SALT_ROUNDS = 10;

export async function registerUser({ name, email, phone, password }) {
  // Check if email or phone already exists
  const existingUsers = await authRepository.checkUserExistsByEmailOrPhone(email, phone);
  if (existingUsers.length > 0) {
    const isEmail = existingUsers.some(u => u.email === email);
    const isPhone = existingUsers.some(u => u.phone === phone);
    const field = isEmail && isPhone ? 'email and phone' : isEmail ? 'email' : 'phone';
    const err = new Error(`User with this ${field} already exists`);
    err.statusCode = 409;
    throw err;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  return await authRepository.createUser(name, email, phone, passwordHash);
}

export async function loginUser({ email, password }) {
  // Find user by email or phone (identifier)
  const user = await authRepository.getUserByIdentifier(email);
  if (!user) {
    const err = new Error('Invalid email/phone or password');
    err.statusCode = 401;
    throw err;
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const err = new Error('Invalid email/phone or password');
    err.statusCode = 401;
    throw err;
  }

  // Fetch roles
  const roles = await authRepository.getUserRoles(user.id);

  // Check if account suspended/inactive
  if (user.status !== 'ACTIVE') {
    if (roles.includes('ADMIN')) {
      const err = new Error('Your administrator account has been approved but is not activated yet. Please contact an active administrator.');
      err.statusCode = 403;
      throw err;
    }
    const err = new Error(`User account is ${user.status.toLowerCase()}`);
    err.statusCode = 403;
    throw err;
  }

  // Check if first login
  const isFirstLogin = !user.first_login_at;

  // Update last login
  await authRepository.updateLastLogin(user.id);

  // Audit log for Admin logins
  if (roles.includes('ADMIN')) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'USER', $1, $3)`,
      [user.id, isFirstLogin ? 'ADMIN_FIRST_LOGIN' : 'ADMIN_LOGIN', JSON.stringify({ email: user.email })]
    );
  }

  // Generate JWT token
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET env variable not set');
  }

  const token = jwt.sign(
    { id: user.id, roles },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles
    }
  };
}

export async function getCurrentUser(userId) {
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const roles = await authRepository.getUserRoles(userId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles
  };
}

export async function becomeDonor(userId, donorData) {
  // 1. Verify user exists
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Verify blood group exists
  const bloodGroup = await authRepository.getBloodGroupById(donorData.blood_group_id);
  if (!bloodGroup) {
    const err = new Error('Invalid blood group ID');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add Donor role
    await authRepository.addRole(userId, 'DONOR', client);

    // Create profile
    await authRepository.createDonorProfile(
      userId,
      donorData.blood_group_id,
      donorData.date_of_birth,
      donorData.gender,
      donorData.phone || user.phone, // fallback to main user phone if none provided
      donorData.address,
      donorData.area,
      donorData.district,
      donorData.state,
      donorData.pincode,
      client
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Generate refreshed token to include new roles
  const roles = await authRepository.getUserRoles(userId);
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ id: userId, roles }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

  return {
    token,
    roles
  };
}

export async function becomeReceiver(userId, receiverData) {
  // 1. Verify user exists
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add Receiver role
    await authRepository.addRole(userId, 'RECEIVER', client);

    // Create profile
    await authRepository.createReceiverProfile(
      userId,
      receiverData.name || user.name,
      receiverData.phone || user.phone,
      receiverData.address,
      receiverData.area,
      receiverData.district,
      receiverData.state,
      receiverData.pincode,
      receiverData.receiver_type || 'INDIVIDUAL',
      client
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Refreshed token to include new roles
  const roles = await authRepository.getUserRoles(userId);
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ id: userId, roles }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

  return {
    token,
    roles
  };
}

export async function requestPasswordReset({ identifier }) {
  const user = await authRepository.getUserByIdentifier(identifier);
  if (!user) {
    // Avoid revealing user existence
    return { message: 'If an account exists with this information, recovery instructions will be sent.' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const minutes = parseInt(process.env.PASSWORD_RESET_TOKEN_MINUTES, 10) || 30;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  // Invalidate any existing active tokens for this user
  await authRepository.invalidateUserResetTokens(user.id);

  // Create new active token
  await authRepository.createResetToken(user.id, tokenHash, expiresAt);

  // Deliver token using corresponding channel
  const isEmail = identifier.includes('@');
  try {
    if (isEmail) {
      await notificationService.sendPasswordResetNotification(user, rawToken);
    } else {
      await notificationService.sendPasswordResetSMS(user, rawToken);
    }
  } catch (error) {
    const err = new Error(`Recovery service is temporarily unavailable: ${error.message}`);
    err.statusCode = 503;
    throw err;
  }

  return { message: 'If an account exists with this information, recovery instructions will be sent.' };
}

export async function resetUserPassword({ token, password }) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const activeToken = await authRepository.getActiveResetToken(tokenHash);

  if (!activeToken) {
    const err = new Error('Invalid or expired reset token');
    err.statusCode = 400;
    throw err;
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Update password in DB
  await authRepository.updateUserPassword(activeToken.user_id, passwordHash);

  // Invalidate this token and other reset tokens for safety
  await authRepository.invalidateUserResetTokens(activeToken.user_id);
  await authRepository.markResetTokenAsUsed(activeToken.id);

  return { message: 'Password reset successfully' };
}

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const hash = await authRepository.getUserPasswordHash(userId);
  if (!hash) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Verify current password matches
  const match = await bcrypt.compare(currentPassword, hash);
  if (!match) {
    const err = new Error('Incorrect current password');
    err.statusCode = 400;
    throw err;
  }

  // Verify it is not identical to current password
  const isSame = await bcrypt.compare(newPassword, hash);
  if (isSame) {
    const err = new Error('New password cannot be the same as your current password');
    err.statusCode = 400;
    throw err;
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepository.updateUserPassword(userId, passwordHash);

  return { message: 'Password changed successfully' };
}

export async function validateInvitationToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = await pool.query(
    `SELECT id, email, name, role, status, expires_at, created_by, link_opened_at 
     FROM internal_invitations 
     WHERE token_hash = $1`,
    [tokenHash]
  );
  const invitation = result.rows[0];

  if (!invitation) {
    const err = new Error('Invalid invitation token');
    err.statusCode = 400;
    throw err;
  }

  if (new Date(invitation.expires_at) < new Date()) {
    const err = new Error('Invitation token has expired');
    err.statusCode = 400;
    throw err;
  }

  if (invitation.status === 'DELETED') {
    const err = new Error('Invitation no longer available. This invitation has been revoked by the Trust administrator.');
    err.statusCode = 400;
    throw err;
  }

  if (invitation.status !== 'INVITED' && invitation.status !== 'EMAIL_FAILED') {
    const err = new Error(`Invitation has already been accepted or processed (Status: ${invitation.status})`);
    err.statusCode = 400;
    throw err;
  }

  // Update link_opened_at if not set and write audit log
  if (!invitation.link_opened_at) {
    await pool.query(
      `UPDATE internal_invitations 
       SET link_opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [invitation.id]
    );
    const isCoord = invitation.role === 'COORDINATOR';
    const actionStr = isCoord ? 'COORDINATOR_INVITATION_OPENED' : 'ADMIN_INVITATION_OPENED';
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'INVITATION', $3, $4)`,
      [invitation.created_by, actionStr, invitation.id, JSON.stringify({ email: invitation.email, role: invitation.role })]
    );
  }

  return invitation;
}

export async function acceptInvitationAndSubmitVerification({ token, password, phone, employee_id, notes, id_card_image }) {
  const invitation = await validateInvitationToken(token);

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or update user as INACTIVE initially
    const userExistRes = await client.query('SELECT id FROM users WHERE email = $1', [invitation.email]);
    let userId;

    if (userExistRes.rows.length > 0) {
      userId = userExistRes.rows[0].id;
      // Update details but keep status INACTIVE until Admin approves
      await client.query(
        `UPDATE users 
         SET name = $1, phone = $2, password_hash = $3, status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4`,
         [invitation.name, phone, passwordHash, userId]
      );
    } else {
      const insertRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, status)
         VALUES ($1, $2, $3, $4, 'INACTIVE')
         RETURNING id`,
        [invitation.name, invitation.email, phone, passwordHash]
      );
      userId = insertRes.rows[0].id;
    }

    // 2. Update invitation status and verification data
    const verificationData = {
      employee_id,
      notes,
      id_card_image,
      phone
    };

    await client.query(
      `UPDATE internal_invitations 
       SET status = 'VERIFICATION_SUBMITTED', accepted_by = $1, verification_data = $2, 
           accepted_at = CURRENT_TIMESTAMP, verification_submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [userId, JSON.stringify(verificationData), invitation.id]
    );

    // 3. Log to audit log
    const isCoord = invitation.role === 'COORDINATOR';
    const acceptAction = isCoord ? 'COORDINATOR_INVITATION_ACCEPTED' : 'ADMIN_INVITATION_ACCEPTED';
    const submitAction = isCoord ? 'COORDINATOR_VERIFICATION_SUBMITTED' : 'ADMIN_VERIFICATION_SUBMITTED';

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'INVITATION', $3, $4)`,
      [userId, acceptAction, invitation.id, JSON.stringify({ email: invitation.email, role: invitation.role })]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'INVITATION', $3, $4)`,
      [userId, submitAction, invitation.id, JSON.stringify({ email: invitation.email, role: invitation.role })]
    );

    await client.query('COMMIT');
    return { message: 'Verification details submitted successfully. Please wait for administrator approval.' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
