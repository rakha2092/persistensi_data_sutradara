const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware untuk autentikasi token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Akses ditolak, token tidak ditemukan' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("JWT Verify Error:", err.message);
            return res.status(403).json({ error: 'Token tidak valid atau kadaluarsa' });
        }
        req.user = decoded.user;
        next();
    });
}

// Middleware untuk membatasi akses berdasarkan role
function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            return next();
        }
        return res.status(403).json({ error: 'Akses Dilarang: Peran tidak memadai' });
    };
}

module.exports = {
    authenticateToken,
    authorizeRole
};