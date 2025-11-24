<script>
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/stores/auth';
    import { onMount } from 'svelte';

    let loading = false;
    let error = null;
    let timeRange = '7d';

    // Analytics data
    let studyStats = {
        totalHours: 0,
        averageHoursPerDay: 0,
        tasksCompleted: 0,
        taskCompletion: 0,
        coursesProgress: [],
        studyTrends: [],
        productiveHours: [],
        pomodoroSessions: 0,
        totalFocusTime: 0
    };

    // Date ranges for filtering
    const timeRanges = [
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' },
        { value: '90d', label: 'Last 90 Days' },
        { value: 'all', label: 'All Time' }
    ];

    async function loadAnalytics() {
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

            // Get study logs
            const { data: studyLogs, error: logsError } = await supabase
                .from('study_logs')
                .select('*')
                .eq('user_id', $user.id)
                // .gte('started_at', startDate.toISOString())
                .order('date');

            if (logsError) throw logsError;

            // Get tasks
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', $user.id)
                .gte('created_at', startDate.toISOString());

            if (tasksError) throw tasksError;

            // Get pomodoro sessions
            const { data: pomodoros, error: pomodoroError } = await supabase
                .from('pomodoro_sessions')
                .select('*')
                .eq('user_id', $user.id)
                .gte('started_at', startDate.toISOString());

            if (pomodoroError) throw pomodoroError;

            // Get course progress
            const { data: courses, error: coursesError } = await supabase
                .from('courses')
                .select(`
                    id,
                    title,
                    roadmaps (
                        progress
                    )
                `)
                .eq('user_id', $user.id);

            if (coursesError) throw coursesError;

            // Calculate statistics
            const totalHours = studyLogs.reduce((acc, log) => {
                const duration = new Date(log.ended_at) - new Date(log.date);
                return acc + (duration / (1000 * 60 * 60));
            }, 0);

            const daysDiff = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)));
            const averageHoursPerDay = totalHours / daysDiff;

            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const taskCompletion = tasks.length ? (completedTasks / tasks.length) * 100 : 0;

            // Calculate study trends by day
            const studyTrends = new Array(daysDiff).fill(0);
            studyLogs.forEach(log => {
                const dayIndex = Math.floor((new Date(log.started_at) - startDate) / (1000 * 60 * 60 * 24));
                const duration = (new Date(log.ended_at) - new Date(log.started_at)) / (1000 * 60 * 60);
                studyTrends[dayIndex] += duration;
            });

            // Calculate productive hours (24-hour distribution)
            const productiveHours = new Array(24).fill(0);
            studyLogs.forEach(log => {
                const startHour = new Date(log.started_at).getHours();
                const duration = (new Date(log.ended_at) - new Date(log.started_at)) / (1000 * 60 * 60);
                productiveHours[startHour] += duration;
            });

            // Calculate course progress
            const coursesProgress = courses.map(course => ({
                title: course.title,
                progress: course.roadmaps?.[0]?.progress || 0
            }));

            // Update statistics
            studyStats = {
                totalHours: Math.round(totalHours * 10) / 10,
                averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
                tasksCompleted: completedTasks,
                taskCompletion: Math.round(taskCompletion),
                coursesProgress,
                studyTrends,
                productiveHours,
                pomodoroSessions: pomodoros.length,
                totalFocusTime: pomodoros.reduce((acc, session) => acc + session.total_duration, 0)
            };

        } catch (err) {
            error = err.message;
            console.error('Error loading analytics:', err);
        } finally {
            loading = false;
        }
    }

    // Load data when time range changes
    $: if (timeRange) {
        loadAnalytics();
    }
</script>

<div class="space-y-8">
    <div>
        <h1 class="text-2xl font-bold text-gray-900">Analytics</h1>
        <p class="mt-1 text-sm text-gray-500">Track your study habits and progress</p>
    </div>

    {#if error}
        <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
        </div>
    {/if}

    <!-- Time Range Filter -->
    <div class="flex justify-end">
        <select
            bind:value={timeRange}
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
            {#each timeRanges as range}
                <option value={range.value}>{range.label}</option>
            {/each}
        </select>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
    {:else}
        <!-- Key Metrics -->
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-lg bg-white p-6 shadow-sm">
                <h3 class="text-sm font-medium text-gray-500">Total Study Hours</h3>
                <p class="mt-2 text-3xl font-semibold text-gray-900">{studyStats.totalHours}</p>
                <p class="mt-1 text-sm text-gray-500">
                    Avg. {studyStats.averageHoursPerDay} hours/day
                </p>
            </div>

            <div class="rounded-lg bg-white p-6 shadow-sm">
                <h3 class="text-sm font-medium text-gray-500">Tasks Completed</h3>
                <p class="mt-2 text-3xl font-semibold text-gray-900">{studyStats.tasksCompleted}</p>
                <p class="mt-1 text-sm text-gray-500">
                    {studyStats.taskCompletion}% completion rate
                </p>
            </div>

            <div class="rounded-lg bg-white p-6 shadow-sm">
                <h3 class="text-sm font-medium text-gray-500">Pomodoro Sessions</h3>
                <p class="mt-2 text-3xl font-semibold text-gray-900">{studyStats.pomodoroSessions}</p>
                <p class="mt-1 text-sm text-gray-500">
                    {Math.round(studyStats.totalFocusTime / 60)} hours of focused work
                </p>
            </div>

            <div class="rounded-lg bg-white p-6 shadow-sm">
                <h3 class="text-sm font-medium text-gray-500">Active Courses</h3>
                <p class="mt-2 text-3xl font-semibold text-gray-900">{studyStats.coursesProgress.length}</p>
                <p class="mt-1 text-sm text-gray-500">
                    {studyStats.coursesProgress.filter(c => c.progress > 0).length} in progress
                </p>
            </div>
        </div>

        <!-- Study Trends -->
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900">Study Trends</h3>
            <div class="mt-4 h-64">
                <div class="flex h-full items-end space-x-2">
                    {#each studyStats.studyTrends as hours, index}
                        {@const height = hours ? (hours / Math.max(...studyStats.studyTrends)) * 100 : 0}
                        <div class="relative flex-1">
                            <div
                                class="absolute bottom-0 w-full rounded-t bg-indigo-200 transition-all hover:bg-indigo-300"
                                style="height: {height}%"
                            >
                                <div class="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-500">
                                    {Math.round(hours * 10) / 10}h
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
            <div class="mt-4 flex justify-between text-xs text-gray-500">
                {#each timeRange === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : [...Array(studyStats.studyTrends.length)].map((_, i) => `Day ${i + 1}`) as label}
                    <span>{label}</span>
                {/each}
            </div>
        </div>

        <!-- Productive Hours -->
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900">Most Productive Hours</h3>
            <div class="mt-4 h-48">
                <div class="flex h-full items-end space-x-1">
                    {#each studyStats.productiveHours as hours, index}
                        {@const height = hours ? (hours / Math.max(...studyStats.productiveHours)) * 100 : 0}
                        <div class="relative flex-1">
                            <div
                                class="absolute bottom-0 w-full rounded-t bg-indigo-200 transition-all hover:bg-indigo-300"
                                style="height: {height}%"
                            >
                                <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                                    {Math.round(hours * 10) / 10}h
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
            <div class="mt-4 flex justify-between text-xs text-gray-500">
                {#each [...Array(24)].map((_, i) => `${i}:00`) as hour}
                    <span>{hour}</span>
                {/each}
            </div>
        </div>

        <!-- Course Progress -->
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900">Course Progress</h3>
            <div class="mt-4 space-y-4">
                {#each studyStats.coursesProgress as course}
                    <div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="font-medium text-gray-700">{course.title}</span>
                            <span class="text-gray-500">{course.progress}%</span>
                        </div>
                        <div class="mt-2 h-2 rounded-full bg-gray-200">
                            <div
                                class="h-2 rounded-full bg-indigo-600"
                                style="width: {course.progress}%"
                            ></div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>