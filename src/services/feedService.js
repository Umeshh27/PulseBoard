import { client } from '../redisClient.js';

const FEED_PREFIX = 'feed:';
const MAX_FEED_LENGTH = 100;

export class FeedService {
    /**
     * Requirement 3: Activity Feed
     * Pushes a new event to a user's activity feed and trims it.
     */
    static async pushEvent(userId, event) {
        const key = `${FEED_PREFIX}${userId}`;
        const eventStr = typeof event === 'string' ? event : JSON.stringify(event);

        // Add to the left of the list (newest first)
        await client.lPush(key, eventStr);
        // Trim the list to MAX_FEED_LENGTH
        await client.lTrim(key, 0, MAX_FEED_LENGTH - 1);
    }

    /**
     * Retrieves the latest feed events for a user.
     */
    static async getFeed(userId, count = 20) {
        const key = `${FEED_PREFIX}${userId}`;
        // Get the latest `count` items
        const items = await client.lRange(key, 0, count - 1);
        
        return items.map(item => {
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        });
    }
}
