const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];

    // Pastikan token ada sebelum mencoba split
    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    // Pastikan format token sesuai dengan "Bearer <token>"
    if (!token.startsWith('Bearer ')) {
        return res.status(400).json({ message: 'Invalid token format' });
    }

    // Mengambil token setelah "Bearer"
    const tokenWithoutBearer = token.split(' ')[1];

    // Verifikasi token JWT
    jwt.verify(tokenWithoutBearer, 'jwt_token_secret', (err, decode) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // Menyimpan data user di request untuk digunakan di route selanjutnya
        req.user = decode;
        next();
    });
};

module.exports = authenticate;
