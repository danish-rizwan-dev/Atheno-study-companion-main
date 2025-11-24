<script>
    import { userStats, tasks, courses, pomodoros } from '$lib/stores/data';
    import { user } from '$lib/stores/auth';
    import { fade, slide } from 'svelte/transition';

    // Derived values for the UI
    $: tiles = [
        {
            title: 'Pending Tasks',
            value: $userStats?.pendingTasks || 0,
            href: '/tasks',
            icon: '📝',
            color: 'from-amber-400/20 to-orange-100/20 text-amber-700 border-amber-200/50'
        },
        {
            title: 'Hours Today',
            value: $userStats?.hoursToday || 0,
            href: '/study-logs',
            icon: '⏱️',
            color: 'from-emerald-400/20 to-teal-100/20 text-emerald-700 border-emerald-200/50'
        },
        {
            title: 'Active Courses',
            value: $userStats?.activeCourses || 0,
            href: '/courses',
            icon: '📚',
            color: 'from-indigo-400/20 to-blue-100/20 text-indigo-700 border-indigo-200/50'
        },
        {
            title: 'Tasks Completed',
            value: $userStats?.completedTasks || 0,
            href: '/tasks',
            icon: '✅',
            color: 'from-blue-400/20 to-cyan-100/20 text-blue-700 border-blue-200/50'
        }
    ];

    // Recents (Safety checks included)
    $: recentTasks = ($tasks || []).slice(0, 3);
    $: recentCourses = ($courses || []).slice(0, 3);
    $: recentPomodoros = ($pomodoros || []).slice(0, 3);
    
    // Get user first name
    $: firstName = $user?.user_metadata?.full_name?.split(' ')[0] || 'Scholar';
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
    <div class="absolute top-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
</div>

<div class="space-y-10 px-2 sm:px-0 pb-20 max-w-7xl mx-auto">

    <div class="relative pt-4">
        <h1 class="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm animate-fade-up tracking-tight">
            Dashboard
        </h1>
        <p class="mt-2 text-gray-600 text-lg animate-fade-up" style="animation-delay: 100ms">
            Welcome back, <span class="font-semibold text-gray-900">{firstName}</span>! You're doing great today.
        </p>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {#each tiles as tile, i}
            <a
                href={tile.href}
                class="group relative overflow-hidden rounded-3xl p-6 shadow-sm border {tile.color.split(' ').pop()} bg-gradient-to-br {tile.color}
                       transition-all duration-300 hover:shadow-xl hover:-translate-y-1 opacity-0 animate-fade-up backdrop-blur-sm"
                style="animation-delay: {150 + i * 100}ms"
            >
                <div class="absolute -right-2 -top-2 text-6xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition duration-500">
                    {tile.icon}
                </div>

                <div class="relative z-10">
                    <p class="text-sm font-semibold text-gray-600 uppercase tracking-wider">{tile.title}</p>
                    <p class="mt-1 text-4xl font-black tracking-tight text-gray-900">{tile.value}</p>
                </div>

                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%] transition duration-[1.2s] pointer-events-none"></div>
            </a>
        {/each}
    </div>

    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

        <div class="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 p-6 shadow-lg opacity-0 animate-fade-up flex flex-col" style="animation-delay: 300ms">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span class="text-xl">⚡</span> Up Next
                </h2>
                <a href="/tasks" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full transition">View All</a>
            </div>
            
            <div class="space-y-3 flex-1">
                {#if recentTasks.length === 0}
                    <div class="h-full flex flex-col items-center justify-center text-center py-8 text-gray-400">
                        <span>🎉</span>
                        <p class="text-sm mt-2">All caught up!</p>
                    </div>
                {:else}
                    {#each recentTasks as task}
                        <a href="/tasks" class="group block bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100 transition p-4 rounded-2xl shadow-sm hover:shadow-md">
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600 transition">{task.title}</p>
                                    {#if task.due_date}
                                        <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            📅 {new Date(task.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                        </p>
                                    {/if}
                                </div>
                                {#if task.priority === 'high'}
                                    <span class="h-2 w-2 rounded-full bg-red-500 mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                                {/if}
                            </div>
                        </a>
                    {/each}
                {/if}
            </div>
        </div>

        <div class="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 p-6 shadow-lg opacity-0 animate-fade-up flex flex-col" style="animation-delay: 400ms">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span class="text-xl">📖</span> Jump Back In
                </h2>
                <a href="/courses" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full transition">Library</a>
            </div>

            <div class="space-y-3 flex-1">
                {#if recentCourses.length === 0}
                    <div class="h-full flex flex-col items-center justify-center text-center py-8 text-gray-400">
                        <span>📚</span>
                        <p class="text-sm mt-2">No courses enrolled.</p>
                    </div>
                {:else}
                    {#each recentCourses as course}
                        <a href={`/courses/${course.id}`} class="group block bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100 transition p-4 rounded-2xl shadow-sm hover:shadow-md">
                            <div class="flex items-center justify-between">
                                <p class="font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600 transition">{course.title}</p>
                                <span class="text-gray-300 group-hover:text-indigo-400 transition">→</span>
                            </div>
                            {#if course.semester}
                                <p class="text-xs font-medium text-indigo-500/70 mt-1">{course.semester}</p>
                            {/if}
                        </a>
                    {/each}
                {/if}
            </div>
        </div>

        <div class="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 p-6 shadow-lg opacity-0 animate-fade-up flex flex-col" style="animation-delay: 500ms">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span class="text-xl">🔥</span> Recent Focus
                </h2>
                <a href="/pomodoro" class="text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 px-3 py-1 rounded-full transition shadow-md hover:shadow-lg">Start New</a>
            </div>

            <div class="space-y-3 flex-1">
                {#if recentPomodoros.length === 0}
                    <div class="h-full flex flex-col items-center justify-center text-center py-8 text-gray-400">
                        <span>⏱️</span>
                        <p class="text-sm mt-2">Ready to focus?</p>
                    </div>
                {:else}
                    {#each recentPomodoros as session}
                        <div class="flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 transition">
                            <div>
                                <p class="font-bold text-gray-800 text-sm">{session.notes || 'Focused Session'}</p>
                                <p class="text-xs text-gray-500 mt-0.5">{new Date(session.created_at).toLocaleDateString()}</p>
                            </div>
                            <div class="text-right">
                                <span class="block font-bold text-indigo-600">{session.work_duration || session.duration}m</span>
                                <span class="text-[10px] text-gray-400 uppercase tracking-wider">Focus</span>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>