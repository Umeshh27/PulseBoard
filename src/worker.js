import { connectRedis, client } from './redisClient.js';

const QUEUE_KEY = 'queue:email_jobs';
const STREAM_KEY = 'stream:events';
const CONSUMER_GROUP = 'worker_group';
const CONSUMER_NAME = 'worker_1';

async function processListQueue() {
    console.log(`Worker listening on list queue: ${QUEUE_KEY}`);
    while (true) {
        try {
            // BRPOP blocks until an item is available or timeout (0 = forever)
            // Node redis 4+ syntax returns { key, element }
            const result = await client.brPop(QUEUE_KEY, 0);
            if (result) {
                console.log(`[Queue Job Processed] ${result.element}`);
                // Simulate processing
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (err) {
            console.error('Error processing list queue:', err);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function setupStreamGroup() {
    try {
        // Create consumer group, $ means only new messages
        await client.xGroupCreate(STREAM_KEY, CONSUMER_GROUP, '$', { MKSTREAM: true });
        console.log(`Created consumer group ${CONSUMER_GROUP} for stream ${STREAM_KEY}`);
    } catch (err) {
        if (err.message.includes('BUSYGROUP')) {
            console.log(`Consumer group ${CONSUMER_GROUP} already exists.`);
        } else {
            throw err;
        }
    }
}

async function processStreamEvents() {
    await setupStreamGroup();
    console.log(`Worker listening on stream: ${STREAM_KEY}`);
    
    // Duplicate client for blocking operations
    const blockingClient = client.duplicate();
    await blockingClient.connect();
    
    while (true) {
        try {
            // XREADGROUP
            const response = await blockingClient.xReadGroup(
                CONSUMER_GROUP,
                CONSUMER_NAME,
                [
                    {
                        key: STREAM_KEY,
                        id: '>' // read new messages
                    }
                ],
                {
                    COUNT: 1,
                    BLOCK: 5000
                }
            );

            if (response && response.length > 0) {
                const streamEntry = response[0];
                const messages = streamEntry.messages;
                
                for (const message of messages) {
                    console.log(`[Stream Event Processed] ID: ${message.id}, Data:`, message.message);
                    
                    // XACK to acknowledge successful processing
                    await blockingClient.xAck(STREAM_KEY, CONSUMER_GROUP, message.id);
                }
            }
        } catch (err) {
            console.error('Error processing stream:', err);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function startWorker() {
    await connectRedis();
    console.log('Worker Service Started');
    
    // Start both consumers concurrently
    processListQueue();
    processStreamEvents();
}

startWorker().catch(console.error);
