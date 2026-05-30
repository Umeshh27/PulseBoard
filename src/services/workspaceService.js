import { client } from '../redisClient.js';
import { FeedService } from './feedService.js';

const WORKSPACE_PREFIX = 'workspace:';
const MEMBERS_SUFFIX = ':members';

export class WorkspaceService {
    /**
     * Requirement 5: Workspace Membership
     * Adds a user to a workspace.
     */
    static async addMember(workspaceId, userId) {
        const key = `${WORKSPACE_PREFIX}${workspaceId}${MEMBERS_SUFFIX}`;
        
        // Requirement 14: Transactions & Atomicity
        // We'll add the user to the workspace AND push an event to their feed atomically
        const multi = client.multi();
        
        multi.sAdd(key, userId);
        
        const feedKey = `feed:${userId}`;
        const event = JSON.stringify({
            type: 'workspace_joined',
            workspaceId,
            timestamp: new Date().toISOString()
        });
        multi.lPush(feedKey, event);
        multi.lTrim(feedKey, 0, 99); // Ensure trim in transaction

        await multi.exec();
    }

    /**
     * Removes a user from a workspace.
     */
    static async removeMember(workspaceId, userId) {
        const key = `${WORKSPACE_PREFIX}${workspaceId}${MEMBERS_SUFFIX}`;
        await client.sRem(key, userId);
    }

    /**
     * Requirement 17: API List Workspace Members
     * Retrieves all members of a given workspace.
     */
    static async getMembers(workspaceId) {
        const key = `${WORKSPACE_PREFIX}${workspaceId}${MEMBERS_SUFFIX}`;
        return await client.sMembers(key);
    }

    /**
     * Determines which workspaces two users have in common.
     * We'd typically store user:workspaces sets to do this efficiently.
     * But since req 5 asks to check common workspaces using SINTER,
     * we need sets of workspaces per user.
     */
    static async getCommonWorkspaces(userId1, userId2) {
        // Assuming we also maintain user:{id}:workspaces sets when they join
        // For completeness in this service, let's assume those keys exist.
        const key1 = `user:${userId1}:workspaces`;
        const key2 = `user:${userId2}:workspaces`;
        return await client.sInter([key1, key2]);
    }
    
    // Helper to add user to a workspace and update the user's workspace list
    static async joinWorkspaceComplete(workspaceId, userId) {
        const wsKey = `${WORKSPACE_PREFIX}${workspaceId}${MEMBERS_SUFFIX}`;
        const userWsKey = `user:${userId}:workspaces`;
        
        const multi = client.multi();
        multi.sAdd(wsKey, userId);
        multi.sAdd(userWsKey, workspaceId);
        await multi.exec();
    }
}
