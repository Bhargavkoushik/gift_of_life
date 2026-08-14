export default function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User is not authenticated'
      });
    }

    const roles = req.user.roles || [];
    if (!roles.includes(requiredRole)) {
      return res.status(403).json({
        status: 'error',
        message: `Insufficient permissions. Role '${requiredRole}' is required.`
      });
    }

    next();
  };
}
