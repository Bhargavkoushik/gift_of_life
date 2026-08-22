export default function requireRole(requiredRole) {
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User is not authenticated'
      });
    }

    const roles = req.user.roles || [];
    const hasRole = allowedRoles.some(r => roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        status: 'error',
        message: `Insufficient permissions. One of the following roles is required: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}
