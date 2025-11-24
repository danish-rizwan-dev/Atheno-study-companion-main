import { browser } from '$app/environment';
import { courses, roadmaps, userStats } from '../stores/data';

let lastRefresh = Date.now();
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function initializeRefreshHandlers() {
    if (!browser) return;

    // Refresh data when tab gains focus
    window.addEventListener('focus', () => {
        const now = Date.now();
        if (now - lastRefresh > REFRESH_INTERVAL) {
            refreshAllData();
            lastRefresh = now;
        }
    });

    // Refresh data when online status changes
    // window.addEventListener('online', refreshAllData);
}

export function refreshAllData() {
    if (!browser) return;

    // Refresh each store
    courses.subscribe(() => {console.log("Refreshing courses...")});
    roadmaps.subscribe(() => {console.log("Refreshing roadmaps...")});
    userStats.subscribe(() => {console.log("Refreshing user stats...")});
    // courses.refresh();
    // roadmaps.refresh();
    // userStats.refresh();
    // Update last refresh time
    lastRefresh = Date.now();
}

// export function refreshAllData() {
//     courses.refresh();
//     roadmaps.refresh();
//     userStats.refresh();
// }