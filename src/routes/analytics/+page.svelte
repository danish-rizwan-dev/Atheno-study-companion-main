<script>
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/stores/auth';
    import { onMount } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- State (Runes) ---
    let loading = $state(false);
    let error = $state(null);
    let timeRange = $state('7d');

    // Default Stats
    let studyStats = $state({
        totalHours: 0,
        averageHoursPerDay: 0,
        tasksCompleted: 0,
        taskCompletion: 0,
        coursesProgress: [],
        studyTrends: [],
        productiveHours: [],
        pomodoroSessions: 0,
        totalFocusTime: 0
    });

    // Configuration
    const timeRanges = [
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' },
        { value: '90d', label: 'Last 90 Days' },
        { value: 'all', label: 'All Time' }
    ];

    // --- Logic ---
    async function loadAnalytics() {
        if (!$user) return;

        try {
            loading = true;
            error = null;

            // Calculate date range
            const now = new Date();
            let startDate;
            if (timeRange === '7d') startDate = new Date(now.setDate(now.getDate() - 7));
            else if (timeRange === '30d') startDate = new Date(now.setDate(now.getDate() - 30));
            else if (timeRange === '90d') startDate = new Date(now.setDate(now.getDate() - 90));
            else startDate = new Date(0); // All time

            // Parallel Data Fetching
            const [logsRes, tasksRes, pomoRes, coursesRes] = await Promise.all([
                supabase.from('study_logs').select('*').eq('user_id', $user.id).gte('started_at', startDate.toISOString()).order('date'),
                supabase.from('tasks').select('*').eq('user_id', $user.id).gte('created_at', startDate.toISOString()),
                supabase.from('pomodoro_sessions').select('*').eq('user_id', $user.id).gte('started_at', startDate.toISOString()),
                supabase.from('courses').select(`id, title, roadmaps(progress)`).eq('user_id', $user.id)
            ]);

            if (logsRes.error) throw logsRes.error;
            if (tasksRes.error) throw tasksRes.error;
            if (pomoRes.error) throw pomoRes.error;
            if (coursesRes.error) throw coursesRes.error;

            const studyLogs = logsRes.data;
            const tasks = tasksRes.data;
            const pomodoros = pomoRes.data;
            const courses = coursesRes.data;

            // --- Calculations ---

            // 1. Total Hours
            const totalHours = studyLogs.reduce((acc, log) => {
                const duration = new Date(log.ended_at) - new Date(log.started_at); // use started/ended for accuracy
                return acc + (duration / (1000 * 60 * 60));
            }, 0);

            const daysDiff = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)));
            const averageHoursPerDay = totalHours / daysDiff;

            // 2. Task Completion
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const taskCompletion = tasks.length ? (completedTasks / tasks.length) * 100 : 0;

            // 3. Trends (Daily)
            // Initialize array based on date range size (approx)
            // Simple mapping for '7d' visualization
            const studyTrends = new Array(timeRange === '7d' ? 7 : 30).fill(0); 
            studyLogs.forEach(log => {
                const dayIndex = Math.floor((new Date(log.started_at) - startDate) / (1000 * 60 * 60 * 24));
                // Clamp index to array bounds
                if (dayIndex >= 0 && dayIndex < studyTrends.length) {
                    const duration = (new Date(log.ended_at) - new Date(log.started_at)) / (1000 * 60 * 60);
                    studyTrends[dayIndex] += duration;
                }
            });

            // 4. Productive Hours (24h)
            const productiveHours = new Array(24).fill(0);
            studyLogs.forEach(log => {
                const startHour = new Date(log.started_at).getHours();
                const duration = (new Date(log.ended_at) - new Date(log.started_at)) / (1000 * 60 * 60);
                productiveHours[startHour] += duration;
            });

            // 5. Course Progress
            const coursesProgress = courses.map(course => ({
                title: course.title,
                progress: course.roadmaps?.[0]?.progress 
                    ? (Object.values(course.roadmaps[0].progress).filter(Boolean).length / Object.keys(course.roadmaps[0].progress).length * 100)
                    : 0
            }));

            // Update State
            studyStats = {
                totalHours: Math.round(totalHours * 10) / 10,
                averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
                tasksCompleted: completedTasks,
                taskCompletion: Math.round(taskCompletion),
                coursesProgress,
                studyTrends,
                productiveHours,
                pomodoroSessions: pomodoros.length,
                totalFocusTime: pomodoros.reduce((acc, session) => acc + (session.work_duration || 0), 0) // using work_duration minutes
            };

        } catch (err) {
            error = err.message;
            console.error(err);
        } finally {
            loading = false;
        }
    }

    // Effect triggers when timeRange changes
    $effect(() => {
        loadAnalytics();
    });
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
</div>

<div class="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 pb-20">

    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
        <div>
            <h1 class="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                Analytics
            </h1>
            <p class="mt-2 text-gray-600 text-lg">
                Insights into your learning habits.
            </p>
        </div>

        <div class="relative">
            <select bind:value={timeRange}
                class="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-md shadow-sm text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all cursor-pointer hover:bg-white/80">
                {#each timeRanges as range}
                    <option value={range.value}>{range.label}</option>
                {/each}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
    </div>

    {#if error}
        <div transition:slide class="rounded-xl bg-red-50/90 backdrop-blur border border-red-200 p-4 text-red-700">
            {error}
        </div>
    {/if}

    {#if loading}
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
            {#each Array(4) as _}
                <div class="h-32 rounded-3xl bg-white/40 border border-white/30"></div>
            {/each}
        </div>
    {:else}
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            <div class="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 p-6 shadow-sm hover:shadow-lg transition-all animate-fade-up">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <span class="text-6xl">⏱️</span>
                </div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Study Time</h3>
                <p class="mt-2 text-4xl font-black text-gray-900">{studyStats.totalHours}<span class="text-lg text-gray-400 font-medium">h</span></p>
                <div class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <span>↗</span> {studyStats.averageHoursPerDay}h daily avg
                </div>
            </div>

            <div class="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 p-6 shadow-sm hover:shadow-lg transition-all animate-fade-up" style="animation-delay: 100ms">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <span class="text-6xl">✅</span>
                </div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tasks Done</h3>
                <p class="mt-2 text-4xl font-black text-gray-900">{studyStats.tasksCompleted}</p>
                <div class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <span>•</span> {studyStats.taskCompletion}% completion
                </div>
            </div>

            <div class="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 p-6 shadow-sm hover:shadow-lg transition-all animate-fade-up" style="animation-delay: 200ms">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <span class="text-6xl">🔥</span>
                </div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Focus Rounds</h3>
                <p class="mt-2 text-4xl font-black text-gray-900">{studyStats.pomodoroSessions}</p>
                <div class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    <span>⚡</span> {Math.round(studyStats.totalFocusTime / 60)}h deep work
                </div>
            </div>

            <div class="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 p-6 shadow-sm hover:shadow-lg transition-all animate-fade-up" style="animation-delay: 300ms">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <span class="text-6xl">📚</span>
                </div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Courses</h3>
                <p class="mt-2 text-4xl font-black text-gray-900">{studyStats.coursesProgress.length}</p>
                <div class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    <span>▶</span> {studyStats.coursesProgress.filter(c => c.progress > 0).length} in progress
                </div>
            </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
            
            <div class="rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 p-6 shadow-sm animate-fade-up" style="animation-delay: 400ms">
                <h3 class="text-lg font-bold text-gray-800 mb-6">Study Trends (Hours)</h3>
                
                <div class="h-64 flex items-end justify-between gap-2">
                    {#each studyStats.studyTrends as hours, i}
                        {@const height = hours ? (hours / Math.max(...studyStats.studyTrends, 1)) * 100 : 5}
                        <div class="relative flex-1 group flex flex-col justify-end h-full">
                            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition mb-2 whitespace-nowrap z-10">
                                {Math.round(hours * 10) / 10} hours
                            </div>
                            
                            <div class="w-full rounded-t-lg bg-gradient-to-t from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 transition-all duration-500 ease-out"
                                style="height: {height}%"></div>
                            
                            <div class="mt-2 text-[10px] text-center text-gray-400 truncate">
                                {timeRange === '7d' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] || `D${i+1}` : ''}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 p-6 shadow-sm animate-fade-up" style="animation-delay: 500ms">
                <h3 class="text-lg font-bold text-gray-800 mb-6">Activity by Hour</h3>
                
                <div class="h-64 flex items-end justify-between gap-1">
                    {#each studyStats.productiveHours as hours, i}
                        {@const height = hours ? (hours / Math.max(...studyStats.productiveHours, 1)) * 100 : 2}
                        <div class="relative flex-1 group flex flex-col justify-end h-full">
                            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition mb-2 z-10">
                                {i}:00
                            </div>
                            
                            <div class="w-full rounded-t bg-indigo-400/50 group-hover:bg-indigo-500 transition-all duration-300"
                                style="height: {height}%"></div>
                        </div>
                    {/each}
                </div>
                <div class="flex justify-between mt-2 text-xs text-gray-400 px-1">
                    <span>12 AM</span>
                    <span>12 PM</span>
                    <span>11 PM</span>
                </div>
            </div>
        </div>

        <div class="rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 p-6 shadow-sm animate-fade-up" style="animation-delay: 600ms">
            <h3 class="text-lg font-bold text-gray-800 mb-6">Course Completion</h3>
            
            <div class="grid gap-6 md:grid-cols-2">
                {#each studyStats.coursesProgress as course}
                    <div class="bg-white/50 rounded-xl p-4 border border-white/50">
                        <div class="flex justify-between items-end mb-2">
                            <span class="font-bold text-gray-700">{course.title}</span>
                            <span class="text-sm font-semibold text-purple-600">{Math.round(course.progress)}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                                style="width: {course.progress}%"></div>
                        </div>
                    </div>
                {/each}
                {#if studyStats.coursesProgress.length === 0}
                    <p class="text-gray-500 text-sm italic">No courses enrolled yet.</p>
                {/if}
            </div>
        </div>

    {/if}
</div>