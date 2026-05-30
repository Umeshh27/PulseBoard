import { v4 as uuidv4 } from 'uuid';
import { client } from '../redisClient.js';

const SESSION_TTL = 3600; // 1 hour in seconds
const SESSION_PREFIX = 'session:';

export class AuthService {
    /**
     * Requirement 1 & 16: Sessions & Authentication / API: User Login
     * Logs in a user, generates a session token, stores it in Redis with TTL.
     */
    static async login(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const token = uuidv4();
        const sessionKey = `${SESSION_PREFIX}${token}`;

        // Set session with expiration
        await client.setEx(sessionKey, SESSION_TTL, userId);

        return token;
    }

    /**
     * Verifies a session token and returns the user ID.
     */
    static async verifySession(token) {
        if (!token) return null;

        const sessionKey = `${SESSION_PREFIX}${token}`;
        const userId = await client.get(sessionKey);

        return userId;
    }

    /**
     * Logs out a user by deleting their session.
     */
    static async logout(token) {
        if (!token) return;
        const sessionKey = `${SESSION_PREFIX}${token}`;
        await client.del(sessionKey);
    }
}

/**
 * Express middleware to require authentication.
 */
export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const userId = await AuthService.verifySession(token);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session' });
    }

    req.user = { id: userId, token };
    next();
};
