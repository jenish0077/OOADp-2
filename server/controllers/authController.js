const User = require('../models/User');

// Simple in-memory sessions (in production, use redis or database)
const sessions = {};

// Generate session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 4 || password.length > 6) {
            return res.status(400).json({ error: 'Password must be between 4 to 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Create user
        const user = new User({ username, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Find user
        let user = await User.findOne({ username });
        
        // Auto-register if user doesn't exist (for demo purposes)
        if (!user) {
            if (username.length < 3) {
                return res.status(400).json({ error: 'Username must be at least 3 characters' });
            }
            if (password.length < 4 || password.length > 6) {
                return res.status(400).json({ error: 'Password must be between 4 to 6 characters' });
            }
            // Create user automatically
            user = new User({ username, password });
            await user.save();
        } else {
            // Check password for existing users
            if (user.password !== password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }

        // Create session
        const sessionId = generateSessionId();
        sessions[sessionId] = {
            userId: user._id.toString(),
            username: user.username,
            createdAt: new Date()
        };

        // Set cookie with session ID
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            message: 'Login successful',
            sessionId: sessionId,
            username: user.username
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId || req.body?.sessionId;
        
        if (sessionId) {
            delete sessions[sessionId];
        }

        res.clearCookie('sessionId');
        res.json({ message: 'Logout successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verify = async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId || req.headers?.authorization?.replace('Bearer ', '');
        
        if (!sessionId || !sessions[sessionId]) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const session = sessions[sessionId];
        res.json({
            authenticated: true,
            username: session.username,
            sessionId: sessionId
        });
    } catch (err) {
        res.status(401).json({ error: 'Not authenticated' });
    }
};

// Export sessions for middleware
exports.sessions = sessions;
