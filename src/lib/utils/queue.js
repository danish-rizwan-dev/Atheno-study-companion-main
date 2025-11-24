import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const QUEUE_KEY = 'sb_request_queue';

// Initialize queue from localStorage
const initialQueue = browser ? JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') : [];
export const requestQueue = writable(initialQueue);

// Save queue to localStorage whenever it changes
requestQueue.subscribe(value => {
    if (browser) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(value));
    }
});

export function addToQueue(request) {
    requestQueue.update(queue => [...queue, {
        ...request,
        id: Date.now(),
        timestamp: new Date().toISOString()
    }]);
}

export function removeFromQueue(requestId) {
    requestQueue.update(queue => queue.filter(req => req.id !== requestId));
}

export async function processQueue() {
    let currentQueue;
    const unsubscribe = requestQueue.subscribe(value => currentQueue = value);

    for (const request of currentQueue) {
        try {
            await processRequest(request);
            removeFromQueue(request.id);
        } catch (error) {
            console.error('Error processing queued request:', error);
            // Keep failed requests in queue for retry
        }
    }

    unsubscribe();
}

async function processRequest(request) {
    const { type, data } = request;

    switch (type) {
        case 'UPDATE_ROADMAP_PROGRESS':
            await updateRoadmapProgress(data);
            break;
        case 'UPDATE_COURSE':
            await updateCourse(data);
            break;
        // Add more cases as needed
    }
}

async function updateRoadmapProgress({ roadmapId, progress }) {
    const { error } = await supabase
        .from('roadmaps')
        .update({ progress })
        .eq('id', roadmapId);

    if (error) throw error;
}

async function updateCourse(courseData) {
    const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseData.id);

    if (error) throw error;
}