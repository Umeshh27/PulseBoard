import express from 'express';
import { connectRedis, client } from './redisClient.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { AuthService, requireAuth } from './services/authService.js';
import { FeedService } from './services/feedService.js';
import { PresenceService } from './services/presenceService.js';
import { WorkspaceService } from './services/workspaceService.js';
import { ProfileService } from './services/profileService.js';
import { MessagingService } from './services/messagingService.js';
import { AnalyticsService } from './services/analyticsService.js';
import { LockService } from './services/lockService.js';

const app = express();
app.use(express.json());

// Global Rate Limiting
app.use(rateLimiter({ max: 100, windowMs: 60 * 1000 }));

// Req 16: API: User Login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, userId } = req.body;
        const id = userId || email; // Simplification for demo
        const token = await AuthService.login(id);
        
        // Also update profile as a bonus
        await ProfileService.updateProfile(id, { email: email || id });
        
        res.json({ session_token: token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// All following routes require authentication
app.use(requireAuth);

app.post('/auth/logout', async (req, res) => {
    await AuthService.logout(req.user.token);
    res.json({ success: true });
});

// Req 4: Presence Tracking Endpoints
app.post('/presence/online', async (req, res) => {
    await PresenceService.markOnline(req.user.id);
    res.json({ success: true });
});

app.post('/presence/offline', async (req, res) => {
    await PresenceService.markOffline(req.user.id);
    res.json({ success: true });
});

app.get('/presence', async (req, res) => {
    const onlineUsers = await PresenceService.getOnlineUsers();
    res.json({ onlineUsers });
});

// Req 5 & 17: Workspace Endpoints
app.post('/workspaces/:id/join', async (req, res) => {
    const workspaceId = req.params.id;
    await WorkspaceService.addMember(workspaceId, req.user.id);
    res.json({ success: true });
});

app.get('/workspaces/:id/members', async (req, res) => {
    const members = await WorkspaceService.getMembers(req.params.id);
    res.json({ members });
});

// Req 3: Activity Feed
app.get('/feed', async (req, res) => {
    const feed = await FeedService.getFeed(req.user.id);
    res.json({ feed });
});

// Req 7: Messaging
app.post('/channels/:id/messages', async (req, res) => {
    const channelId = req.params.id;
    const { text } = req.body;
    
    await MessagingService.publishMessage(channelId, { userId: req.user.id, text });
    await AnalyticsService.incrementChannelActivity(channelId);
    
    res.json({ success: true });
});

// Req 9 & 18: Trending Channels API
app.get('/analytics/trending', async (req, res) => {
    const trending = await AnalyticsService.getTrendingChannels(10);
    res.json({ trending });
});

// Req 11: DAU
app.post('/analytics/dau', async (req, res) => {
    await AnalyticsService.recordDailyActiveUser(req.user.id);
    res.json({ success: true });
});

// Req 15: Background Job Queue (Enqueue Job)
app.post('/jobs/email', async (req, res) => {
    const jobPayload = JSON.stringify({
        type: 'send_email',
        userId: req.user.id,
        timestamp: Date.now()
    });
    
    // Add job to a Redis List
    await client.lPush('queue:email_jobs', jobPayload);
    res.json({ success: true, message: 'Job enqueued via List' });
});

// Req 8: Event Streaming (Enqueue Event)
app.post('/events/system', async (req, res) => {
    // Add event to Stream
    await client.xAdd('stream:events', '*', {
        type: 'user_action',
        userId: req.user.id,
        action: req.body.action || 'ping'
    });
    res.json({ success: true, message: 'Event added to Stream' });
});

// Req 10: Locking test
app.post('/system/report', async (req, res) => {
    const locked = await LockService.acquireLock('daily_digest', 30);
    if (!locked) {
        return res.status(409).json({ error: 'Report generation already in progress' });
    }
    
    // Simulate work
    setTimeout(async () => {
        await LockService.releaseLock('daily_digest');
    }, 5000);
    
    res.json({ success: true, message: 'Report generation started' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectRedis();
    app.listen(PORT, () => {
        console.log(`API Server running on port ${PORT}`);
    });
};

startServer().catch(console.error);
