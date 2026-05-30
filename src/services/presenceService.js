import { client } from '../redisClient.js';

const ONLINE_USERS_KEY = 'online_users';

export class PresenceService {
    /**
     * Requirement 4: Presence Tracking
     * Marks a user as online.
     */
    static async markOnline(userId) {
        await client.sAdd(ONLINE_USERS_KEY, userId);
    }

    /**
     * Marks a user as offline.
     */
    static async markOffline(userId) {
        await client.sRem(ONLINE_USERS_KEY, userId);
    }

    /**
     * Retrieves a list of all online users.
     */
    static async getOnlineUsers() {
        return await client.sMembers(ONLINE_USERS_KEY);
    }

    /**
     * Checks if a specific user is online.
     */
    static async isUserOnline(userId) {
        return await client.sIsMember(ONLINE_USERS_KEY, userId);
    }
}
