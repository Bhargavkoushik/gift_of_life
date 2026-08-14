import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
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
