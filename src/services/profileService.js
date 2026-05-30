import { client } from '../redisClient.js';

const USER_PREFIX = 'user:';

export class ProfileService {
    /**
     * Requirement 6: User Profiles
     * Creates or updates a user profile using a Redis Hash.
     */
    static async updateProfile(userId, profileData) {
        const key = `${USER_PREFIX}${userId}`;
        
        // HSET takes an array or object in newer node-redis
        // Convert any non-string values to strings before setting (e.g. nested objects or booleans)
        const flattenedData = {};
        for (const [k, v] of Object.entries(profileData)) {
            flattenedData[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
        }

        await client.hSet(key, flattenedData);
    }

    /**
     * Retrieves a specific field from a user's profile.
     */
    static async getProfileField(userId, field) {
        const key = `${USER_PREFIX}${userId}`;
        return await client.hGet(key, field);
    }

    /**
     * Retrieves multiple fields from a user's profile.
     */
    static async getProfileFields(userId, fields) {
        const key = `${USER_PREFIX}${userId}`;
        return await client.hmGet(key, fields);
    }

    /**
     * Retrieves the entire user profile.
     */
    static async getFullProfile(userId) {
        const key = `${USER_PREFIX}${userId}`;
        return await client.hGetAll(key);
    }

    /**
     * Checks if a user profile exists.
     */
    static async profileExists(userId) {
        const key = `${USER_PREFIX}${userId}`;
        return await client.exists(key);
    }
}
