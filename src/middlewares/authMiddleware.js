import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY ;

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Aucun token fourni' });
  }

  try {
    const decoded = jwt.verify(token,SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

export default authMiddleware;