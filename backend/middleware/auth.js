const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ message: "Akses Ditolak! Token tidak ada." });

    jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara', (err, decoded) => {
        if (err) {
            // Membedakan antara token expired dan token invalid
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: "Token kadaluarsa. Silakan refresh token atau login ulang.",
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(403).json({ message: "Token tidak valid." });
        }
        req.user = decoded; 
        next(); 
    });
};

// Middleware untuk verifikasi role (opsional)
const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Token tidak ada" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Akses ditolak! Hanya ${allowedRoles.join(', ')} yang bisa mengakses.` 
            });
        }

        next();
    };
};

module.exports = { verifyToken, verifyRole };
