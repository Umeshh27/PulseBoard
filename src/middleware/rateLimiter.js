import { client } from '../redisClient.js';

/**
 * Rate limiting middleware using Redis.
 * Limits users to a certain number of requests per window.
 */
export const rateLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute default
        max = 100, // max requests per window
        keyPrefix = 'rate_limit:'
    } = options;

    return async (req, res, next) => {
        // We'll use user ID if authenticated, otherwise IP address
        const identifier = req.user?.id || req.ip;
        
        // Use a minute timestamp or just a rounded timestamp based on windowMs
        const currentWindow = Math.floor(Date.now() / windowMs);
        const key = `${keyPrefix}${identifier}:${currentWindow}`;

        try {
            // Increment the counter
            const requests = await client.incr(key);

            // If it's the first request in the window, set the expiry
            if (requests === 1) {
                // Set expiry in seconds. Math.ceil just in case.
                await client.expire(key, Math.ceil(windowMs / 1000));
            }

            if (requests > max) {
                return res.status(429).json({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Try again later.'
                });
            }

            // Optional: Set rate limit headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - requests));

            next();
        } catch (err) {
            console.error('Rate Limiter Error:', err);
            next(err);
        }
    };
};
