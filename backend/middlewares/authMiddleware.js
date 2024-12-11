const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust based on your project structure

exports.authenticateUser = async (req, res, next) => {
    // Extract token from cookies or Authorization header
    const token = req.cookies.user_jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Find the user based on the decoded token
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Attach user data to the request object
        req.user = user;

        // Proceed to the next middleware
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Invalid token' });
        }
        console.error('JWT verification error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
