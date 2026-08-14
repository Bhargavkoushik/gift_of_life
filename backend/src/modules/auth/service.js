import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../database/connection.js';
import * as authRepository from './repository.js';

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

  // Check if account suspended/inactive
  if (user.status !== 'ACTIVE') {
    const err = new Error(`User account is ${user.status.toLowerCase()}`);
    err.statusCode = 403;
    throw err;
  }

  // Fetch roles
  const roles = await authRepository.getUserRoles(user.id);

  // Update last login
  await authRepository.updateLastLogin(user.id);

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
