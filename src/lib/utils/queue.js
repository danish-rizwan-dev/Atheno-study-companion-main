import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';

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
    unsubscribe();

    for (const request of currentQueue) {
        try {
            await processRequest(request);
            removeFromQueue(request.id);
        } catch (error) {
            console.error('Error processing queued request:', error);
        }
    }
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

        // ✅ Critical for Timer Persistence
        case 'CREATE_POMODORO_SESSION':
            await createPomodoroSession(data);
            break;

        case 'CREATE_STUDY_LOG':
            await createStudyLog(data);
            break;
            
        case 'UPDATE_TASK_STATUS':
            await updateTaskStatus(data);
            break;
    }
}

// --- DB Handlers ---

async function updateRoadmapProgress({ roadmapId, progress }) {
    const { error } = await supabase
        .from('roadmaps')
        .update({ progress })
        .eq('id', roadmapId);
    if (error) throw error;
}

async function updateCourse(courseData) {
    const { id, ...updates } = courseData;
    const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id);
    if (error) throw error;
}

async function createPomodoroSession(sessionData) {
    const { error } = await supabase
        .from('pomodoro_sessions')
        .insert(sessionData);
    if (error) throw error;
}

async function createStudyLog(logData) {
    const { error } = await supabase
        .from('study_logs')
        .insert(logData);
    if (error) throw error;
}

async function updateTaskStatus({ taskId, status }) {
    const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);
    if (error) throw error;
}

if (browser) {
    window.addEventListener('online', processQueue);
}