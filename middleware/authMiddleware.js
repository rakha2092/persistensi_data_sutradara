const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'akses ditolak, token tidak ditemukan' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    if (err) {
      console.error("jwt verify error:", err.message);
      return res.status(403).json({ error: 'token tidak valid atau kedaluwarsa' });
    }
    req.user = decodedPayload.user;
    next();
  });
}

module.exports = authenticateToken;
