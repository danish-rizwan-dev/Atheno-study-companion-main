<script>
    import { userStats } from '$lib/stores/data';
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
</script>

<footer
    in:fly={{ y: 20, duration: 800, delay: 200, easing: quintOut }}
    class="fixed bottom-8 left-1/2 -translate-x-1/2 hidden md:flex z-40 select-none pointer-events-none"
>
    <div
        class="relative pointer-events-auto bg-white/75 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]
               px-6 py-3 rounded-full flex items-center gap-6 text-sm
               transition-all duration-500 hover:shadow-[0_8px_40px_rgba(99,102,241,0.25)] hover:-translate-y-1 hover:bg-white/90 group"
    >

        <div
            class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full
                   opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%]
                   transition duration-[1.5s] pointer-events-none"
        ></div>

        <div class="flex items-center gap-2.5 group/item">
            <svg class="w-4 h-4 text-gray-400 group-hover/item:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <div class="flex items-baseline gap-1">
                <span class="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {$userStats?.pendingTasks || 0}
                </span>
                <span class="text-gray-500 font-medium text-xs uppercase tracking-wide">Pending</span>
            </div>
        </div>

        <div class="w-px h-4 bg-gray-300/50"></div>

        <div class="flex items-center gap-2.5 group/item">
            <svg class="w-4 h-4 text-gray-400 group-hover/item:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex items-baseline gap-1">
                <span class="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {$userStats?.hoursToday || 0}h
                </span>
                <span class="text-gray-500 font-medium text-xs uppercase tracking-wide">Focused</span>
            </div>
        </div>

        <div class="w-px h-4 bg-gray-300/50"></div>

        <div class="flex items-center gap-2.5 group/item">
            <svg class="w-4 h-4 text-gray-400 group-hover/item:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex items-baseline gap-1">
                <span class="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {$userStats?.completedTasks || 0}
                </span>
                <span class="text-gray-500 font-medium text-xs uppercase tracking-wide">Done</span>
            </div>
        </div>

        <div class="w-px h-4 bg-gray-300/50"></div>

        <div class="flex items-center gap-2.5 group/item">
            <svg class="w-4 h-4 text-gray-400 group-hover/item:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div class="flex items-baseline gap-1">
                <span class="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {$userStats?.activeCourses || 0}
                </span>
                <span class="text-gray-500 font-medium text-xs uppercase tracking-wide">Courses</span>
            </div>
        </div>

    </div>
</footer>