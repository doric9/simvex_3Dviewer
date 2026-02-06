/**
 * User identification utilities for anonymous progress tracking.
 */

const USER_ID_KEY = 'simvex_user_id';

/**
 * Gets or creates an anonymous user ID for tracking learning progress.
 * The ID is persisted in localStorage across sessions.
 */
export function getAnonymousUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
        userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
}
