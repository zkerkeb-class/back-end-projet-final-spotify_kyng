const roles = require('../config/roles');

const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    const userRole = req.user?.role; // Assure-toi que `req.user` contient les infos utilisateur après authentification
    if (!userRole) {
      return res.status(401).json({ message: 'Unauthorized: no role assigned.' });
    }

    const rolePermissions = roles[userRole] || [];
    const hasPermission = requiredPermissions.every((perm) => rolePermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions.' });
    }

    next();
  };
};

module.exports = checkPermission;
