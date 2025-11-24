import { supabase } from '$lib/supabase';
import { createCachedStore } from '$lib/utils/cache';
import { user } from './auth';

let currentUserId = null;
user.subscribe(value => currentUserId = value?.id);

// Courses Store
export const courses = createCachedStore('courses', [], async () => {
    if (!currentUserId) return [];
    
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
});

// Roadmaps Store
export const roadmaps = createCachedStore('roadmaps', [], async () => {
    if (!currentUserId) return [];
    
    const { data, error } = await supabase
        .from('roadmaps')
        .select(`
            *,
            course:courses (
                title
            )
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });
    
    console.log('Roadmaps:', data);

    if (error) throw error;
    return data || [];
});

// Tasks Store
export const tasks = createCachedStore('tasks', [], async () => {
    if (!currentUserId) return [];
    
    const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            course:courses (
                id,
                title
            )
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
});

export const pomodoros = createCachedStore('pomodoros', [], async () => {
    if (!currentUserId) return [];

    const {data, error} = await supabase
        .from('pomodoro_sessions')
        .select(`*,
                courses:courses(
                id,
                title
            )
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
})

// User Stats Store
export const userStats = createCachedStore('user_stats', {
    pendingTasks: 0,
    hoursToday: 0,
    completedTasks: 0,
    activeCourses: 0
}, async () => {
    if (!currentUserId) return null;

    const today = new Date().toISOString().split('T')[0];
    
    // Get all stats in parallel
    const [
        { count: pendingTasks },
        { data: studyLogs },
        { count: completedTasks },
        { count: activeCourses }
    ] = await Promise.all([
        supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('user_id', currentUserId)
            .neq('status', 'completed'),
        supabase
            .from('study_logs')
            .select('started_at, ended_at')
            .eq('user_id', currentUserId)
            .gte('started_at', today),
        supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('user_id', currentUserId)
            .eq('status', 'completed')
            .gte('created_at', today),
        supabase
            .from('courses')
            .select('*', { count: 'exact' })
            .eq('user_id', currentUserId)
    ]);

    const hoursToday = studyLogs?.reduce((acc, log) => {
        const duration = new Date(log.ended_at) - new Date(log.started_at);
        return acc + (duration / (1000 * 60 * 60));
    }, 0) || 0;

    return {
        pendingTasks: pendingTasks || 0,
        hoursToday: Math.round(hoursToday * 10) / 10,
        completedTasks: completedTasks || 0,
        activeCourses: activeCourses || 0
    };
});

// Refresh all stores when user changes
// user.subscribe(() => {
//     courses.refresh();
//     roadmaps.refresh();
//     userStats.refresh();
// });