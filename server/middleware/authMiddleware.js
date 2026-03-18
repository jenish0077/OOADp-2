const authController = require('../controllers/authController');

const authMiddleware = (req, res, next) => {
    const sessionId = req.cookies?.sessionId || req.headers?.authorization?.replace('Bearer ', '');
    
    if (!sessionId || !authController.sessions[sessionId]) {
        return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }

    // Attach session info to request
    req.session = authController.sessions[sessionId];
    next();
};

module.exports = authMiddleware;
