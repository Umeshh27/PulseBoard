import { client } from '../redisClient.js';

export class MessagingService {
    /**
     * Requirement 7: Real-Time Messaging (Pub/Sub)
     * Publishes a message to a channel.
     */
    static async publishMessage(channelId, message) {
        const topic = `channel:${channelId}:messages`;
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        await client.publish(topic, payload);
    }

    /**
     * Subscribes to a channel.
     * Note: In Node.js redis, subscribing requires a duplicate connection
     * because the connection gets put into subscriber mode.
     */
    static async subscribeToChannel(channelId, callback) {
        const subscriber = client.duplicate();
        await subscriber.connect();
        
        const topic = `channel:${channelId}:messages`;
        
        await subscriber.subscribe(topic, (message) => {
            try {
                callback(JSON.parse(message));
            } catch {
                callback(message);
            }
        });

        // Return the subscriber so it can be unsubscribed/closed later if needed
        return subscriber;
    }
}
