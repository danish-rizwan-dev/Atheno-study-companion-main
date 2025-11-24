<script>
    import { userStats } from '$lib/stores/data';
</script>

<footer class="fixed bottom-4 left-1/2 -translate-x-1/4 hidden md:block select-none">
    <div class="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border-indigo-600 border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102 gradient-text">
        <div class="flex items-center space-x-6 text-sm">
            <div class="flex items-center text-gray-600">
                <span class="font-semibold text-indigo-600">{$userStats.pendingTasks}</span>
                <span class="ml-1">{$userStats.pendingTasks === 1 ? 'pending task' : 'pending tasks'}</span>
            </div>

            <div class="w-1 h-1 bg-gray-300 rounded-full"></div>

            <div class="flex items-center text-gray-600">
                <span class="font-semibold text-indigo-600">{$userStats.hoursToday}</span>
                <span class="ml-1">hours today</span>
            </div>

            <div class="w-1 h-1 bg-gray-300 rounded-full"></div>

            <div class="flex items-center text-gray-600">
                <span class="font-semibold text-indigo-600">{$userStats.completedTasks}</span>
                <span class="ml-1">{$userStats.completedTasks === 1 ? 'task completed' : 'tasks completed'}</span>
            </div>

            <div class="w-1 h-1 bg-gray-300 rounded-full"></div>

            <div class="flex items-center text-gray-600">
                <span class="font-semibold text-indigo-600">{$userStats.activeCourses}</span>
                <span class="ml-1">{$userStats.activeCourses === 1 ? 'active course' : 'active courses'}</span>
            </div>
        </div>
    </div>
</footer>
