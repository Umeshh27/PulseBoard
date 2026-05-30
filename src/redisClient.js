import { createClient } from 'redis';

// Create a Redis client
const client = createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
        console.log('Connected to Redis');
    }
}

export { client, connectRedis };
