/*const roles = require('../config/roles');
const isAuthRequiredForRole = require('../utils/rolesAuthCheck');

const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'guest'; 

    if (isAuthRequiredForRole(userRole)) {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: Authentication required.' });
      }
    }

    const rolePermissions = roles[userRole] || [];
    const hasPermission = requiredPermissions.every((perm) => rolePermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions.' });
    }

    next();
  };
};

module.exports = checkPermission; */
