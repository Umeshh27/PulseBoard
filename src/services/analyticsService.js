import { client } from '../redisClient.js';

export class AnalyticsService {
    /**
     * Requirement 9: Trending Channels & Reputation
     * Increments the activity score for a channel.
     */
    static async incrementChannelActivity(channelId) {
        const key = 'trending:channels';
        await client.zIncrBy(key, 1, channelId);
    }

    /**
     * Retrieves the top N trending channels.
     */
    static async getTrendingChannels(limit = 10) {
        const key = 'trending:channels';
        // zRevRange is deprecated in some newer versions, use zRange with REV
        // But node-redis still supports it or ZRANGE key 0 -1 REV
        // Let's use the new ZRANGE syntax if available, or just zRange
        return await client.zRange(key, 0, limit - 1, { REV: true });
    }

    /**
     * Requirement 11: Approximate Analytics (DAU)
     * Tracks a user for DAU using HyperLogLog.
     */
    static async recordDailyActiveUser(userId) {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `analytics:dau:${date}`;
        await client.pfAdd(key, userId);
    }

    /**
     * Gets the DAU count for a specific date.
     */
    static async getDailyActiveUsers(date) {
        const key = `analytics:dau:${date}`;
        return await client.pfCount(key);
    }

    /**
     * Requirement 12: Attendance & Binary Tracking
     * Records a user's activity for a given day in a month using Bitmaps.
     */
    static async recordAttendance(userId) {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const dayOfMonth = now.getDate(); // 1-31
        
        const key = `attendance:${userId}:${yearMonth}`;
        // Bit offset is day of month (0-indexed or 1-indexed, we'll use dayOfMonth as offset)
        await client.setBit(key, dayOfMonth, 1);
    }

    /**
     * Checks if a user was active on a specific day.
     */
    static async checkAttendance(userId, yearMonth, dayOfMonth) {
        const key = `attendance:${userId}:${yearMonth}`;
        return await client.getBit(key, dayOfMonth);
    }

    /**
     * Counts the total active days for a user in a month.
     */
    static async countAttendanceDays(userId, yearMonth) {
        const key = `attendance:${userId}:${yearMonth}`;
        return await client.bitCount(key);
    }

    /**
     * Requirement 13: Geospatial Awareness
     * Updates a user's location.
     */
    static async updateUserLocation(userId, longitude, latitude) {
        const key = 'geo:active_users';
        await client.geoAdd(key, {
            longitude,
            latitude,
            member: userId
        });
    }

    /**
     * Finds users within a certain radius.
     */
    static async findNearbyUsers(longitude, latitude, radiusKm) {
        const key = 'geo:active_users';
        // GEOSEARCH key FROMLONLAT lon lat BYRADIUS radius km
        return await client.geoSearch(
            key,
            { longitude, latitude },
            { radius: radiusKm, unit: 'km' }
        );
    }
}
