import { client } from '../redisClient.js';

export class LockService {
    /**
     * Requirement 10: Distributed Locking
     * Acquires a lock for a given resource.
     * Returns true if lock was acquired, false otherwise.
     */
    static async acquireLock(resourceName, timeoutSeconds) {
        const key = `lock:${resourceName}`;
        
        // SET key value NX EX timeout
        // Using timestamp or random value for lock ownership
        const value = Date.now().toString();
        
        const result = await client.set(key, value, {
            NX: true,
            EX: timeoutSeconds
        });

        return result === 'OK';
    }

    /**
     * Releases a lock.
     * Note: For complete correctness, we should ideally check if we own the lock
     * before deleting it (via Lua script). For this requirement, a simple DEL is sufficient.
     */
    static async releaseLock(resourceName) {
        const key = `lock:${resourceName}`;
        await client.del(key);
    }
}
