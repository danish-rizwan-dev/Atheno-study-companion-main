import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Database types for TypeScript support
export const DatabaseTables = {
    USERS: 'users',
    COURSES: 'courses',
    ROADMAPS: 'roadmaps',
    ROADMAP_ITEMS: 'roadmap_items',
    FLASHCARD_SETS: 'flashcard_sets',
    FLASHCARDS: 'flashcards',
    TASKS: 'tasks',
    POMODORO_SESSIONS: 'pomodoro_sessions',
    STUDY_LOGS: 'study_logs',
    USER_EVENTS: 'user_events',
    USER_METRICS: 'user_metrics'
};