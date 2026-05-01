import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ada.' });
  }
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid.' });
  }
}