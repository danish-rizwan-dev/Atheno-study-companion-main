import { browser } from '$app/environment';
import { refreshAllData } from './refresh';
import { user } from '../stores/auth';
import { processQueue } from './queue';

let syncInterval;
const SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function initializeSync() {
    if (!browser) return;

    // Clear any existing sync interval
    if (syncInterval) {
        clearInterval(syncInterval);
    }

    // Set up sync interval when user is logged in
    const unsubscribe = user.subscribe($user => {
        if ($user) {
            syncInterval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    // refreshAllData();
                }
            }, SYNC_INTERVAL);

            // Process queue when coming online
            window.addEventListener('online', async () => {
                try {
                    await processQueue();
                    // await refreshAllData();
                } catch (error) {
                    console.error('Error processing queue:', error);
                }
            });
        } else if (syncInterval) {
            clearInterval(syncInterval);
        }
    });

    // Clean up on page unload
    window.addEventListener('unload', () => {
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        unsubscribe();
    });
}