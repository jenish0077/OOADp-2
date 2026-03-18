// Frontend Auth Utility
const API_BASE = 'http://localhost:3000/api';

// Store session ID in localStorage
const Auth = {
    // Login
    login: async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await res.json();
            localStorage.setItem('sessionId', data.sessionId);
            localStorage.setItem('username', data.username);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const res = await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
                credentials: 'include'
            });

            localStorage.removeItem('sessionId');
            localStorage.removeItem('username');
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('sessionId');
            localStorage.removeItem('username');
            return true;
        }
    },

    // Check if authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('sessionId');
    },

    // Get current username
    getUsername: () => {
        return localStorage.getItem('username');
    },

    // Get session ID
    getSessionId: () => {
        return localStorage.getItem('sessionId');
    },

    // Verify session with backend
    verify: async () => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) return false;

            const res = await fetch(`${API_BASE}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${sessionId}`
                },
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                return data.authenticated;
            } else {
                localStorage.removeItem('sessionId');
                localStorage.removeItem('username');
                return false;
            }
        } catch (error) {
            console.error('Verify error:', error);
            return false;
        }
    },

    // Redirect to login if not authenticated
    requireAuth: async (callback) => {
        const isAuth = await Auth.verify();
        if (!isAuth) {
            window.location.href = 'index.html';
            return false;
        }
        if (callback) callback();
        return true;
    }
};
