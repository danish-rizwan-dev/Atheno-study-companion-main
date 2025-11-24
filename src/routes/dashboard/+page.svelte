<script>
    import { userStats, tasks, courses, pomodoros } from '$lib/stores/data';
    import { goto } from '$app/navigation';

    let tiles = [
        {
            title: 'Pending Tasks',
            value: $userStats.pendingTasks,
            href: '/tasks',
            icon: '📝',
            color: 'bg-yellow-50 text-yellow-700'
        },
        {
            title: 'Hours Today',
            value: $userStats.hoursToday,
            href: '/study-logs',
            icon: '⏱️',
            color: 'bg-green-50 text-green-700'
        },
        {
            title: 'Active Courses',
            value: $userStats.activeCourses,
            href: '/courses',
            icon: '📚',
            color: 'bg-indigo-50 text-indigo-700'
        },
        {
            title: 'Tasks Completed',
            value: $userStats.completedTasks,
            href: '/tasks',
            icon: '✅',
            color: 'bg-blue-50 text-blue-700'
        }
    ];

    // Get recent items
    $: recentTasks = $tasks.slice(0, 3);
    $: recentCourses = $courses.slice(0, 3);
    $: recentPomodoros = $pomodoros.slice(0, 3);
</script>

<div class="space-y-8">
    <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-1 text-sm text-gray-500">Welcome back! Here's an overview of your study progress.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {#each tiles as tile}
            <a 
                href={tile.href}
                class="group relative overflow-hidden rounded-lg p-6 transition-all hover:shadow-md {tile.color}"
            >
                <div class="absolute right-4 top-4 text-2xl opacity-20">{tile.icon}</div>
                <p class="text-sm font-medium">{tile.title}</p>
                <p class="mt-2 text-3xl font-semibold">{tile.value}</p>
            </a>
        {/each}
    </div>

    <!-- Recent Activity Grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <!-- Recent Tasks -->
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                <a href="/tasks" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</a>
            </div>
            <div class="mt-4 space-y-3">
                {#if recentTasks.length === 0}
                    <p class="text-sm text-gray-500">No tasks yet</p>
                {:else}
                    {#each recentTasks as task}
                        <a 
                            href="/tasks"
                            class="block rounded-lg bg-gray-50 p-3 hover:bg-gray-100"
                        >
                            <div class="flex items-center justify-between">
                                <p class="font-medium text-gray-900">{task.title}</p>
                                <span class="text-xs text-gray-500">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </span>
                            </div>
                            {#if task.description}
                                <p class="mt-1 text-sm text-gray-500 line-clamp-1">{task.description}</p>
                            {/if}
                        </a>
                    {/each}
                {/if}
            </div>
        </div>

        <!-- Recent Courses -->
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Active Courses</h2>
                <a href="/courses" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</a>
            </div>
            <div class="mt-4 space-y-3">
                {#if recentCourses.length === 0}
                    <p class="text-sm text-gray-500">No courses yet</p>
                {:else}
                    {#each recentCourses as course}
                        <a 
                            href="/courses/{course.id}"
                            class="block rounded-lg bg-gray-50 p-3 hover:bg-gray-100"
                        >
                            <p class="font-medium text-gray-900">{course.title}</p>
                            {#if course.semester}
                                <p class="mt-1 text-sm text-indigo-600">{course.semester}</p>
                            {/if}
                        </a>
                    {/each}
                {/if}
            </div>
        </div>

        <!-- Recent Pomodoro Sessions -->
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Recent Study Sessions</h2>
                <a href="/pomodoro" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">New Session</a>
            </div>
            <div class="mt-4 space-y-3">
                {#if recentPomodoros.length === 0}
                    <p class="text-sm text-gray-500">No study sessions yet</p>
                {:else}
                    {#each recentPomodoros as session}
                        <div class="rounded-lg bg-gray-50 p-3">
                            <div class="flex items-center justify-between">
                                <p class="font-medium text-gray-900">{session.title || 'Untitled Session'}</p>
                                <span class="text-xs text-gray-500">
                                    {new Date(session.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p class="mt-1 text-sm text-gray-500">
                                Duration: {session.duration} minutes
                            </p>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>