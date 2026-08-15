import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access token is missing or invalid'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        status: 'error',
        message: 'JWT Secret is not configured'
      });
    }

    const decoded = jwt.verify(token, secret);

    // Verify user exists and is active in database
    const userRes = await pool.query('SELECT status FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'User account not found'
      });
    }

    if (userRes.rows[0].status !== 'ACTIVE') {
      const rolesRes = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [decoded.id]);
      const roles = rolesRes.rows.map(r => r.role);
      if (roles.includes('ADMIN')) {
        return res.status(401).json({
          status: 'error',
          message: 'Your administrator account has been approved but is not activated yet. Please contact an active administrator.'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: `User account is ${userRes.rows[0].status.toLowerCase()}`
      });
    }

    req.user = {
      id: decoded.id,
      roles: decoded.roles || []
    };
    next();
  } catch (error) {
    console.error('JWT Verification failed:', error.message);
    const message = error.name === 'TokenExpiredError' 
      ? 'Token has expired' 
      : 'Invalid token';
    
    return res.status(401).json({
      status: 'error',
      message
    });
  }
}
