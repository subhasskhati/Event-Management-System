const jwt = require('jsonwebtoken');

// middleware to protect routes
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token') || (req.header('authorization') || '').replace(/^Bearer\s+/i, '');

    // check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey123');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
