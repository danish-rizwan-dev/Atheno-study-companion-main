<script>
    import { courses } from '$lib/stores/data';
    import { timer } from '$lib/stores/pomodoroTimer.svelte'; 
    import { fade, slide } from 'svelte/transition';

    // Audio Context (Lazy loaded)
    let workAudio;
    let breakAudio;

    // Reactive audio trigger
    // We track the break state to play sound only when it changes
    let lastBreakState = $state(false);

    $effect(() => {
        if (timer.isBreak !== lastBreakState) {
            if (timer.isBreak && breakAudio) breakAudio.play().catch(() => {});
            if (!timer.isBreak && workAudio && timer.isRunning) workAudio.play().catch(() => {});
            lastBreakState = timer.isBreak;
        }
    });
</script>

<!-- Sound Effects -->
<audio bind:this={workAudio} src="/sounds/work-start.mp3"></audio>
<audio bind:this={breakAudio} src="/sounds/break-start.mp3"></audio>

<!-- Ambient Background (Dynamic Color Change) -->
<div class="fixed inset-0 pointer-events-none -z-10 transition-colors duration-1000 overflow-hidden bg-gray-50/50">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-pulse transition-colors duration-1000
        {timer.isBreak ? 'bg-teal-300' : 'bg-indigo-300'}"></div>
    <div class="absolute top-0 right-0 w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob
        {timer.isBreak ? 'bg-green-200' : 'bg-purple-200'}"></div>
</div>

<div class="min-h-[80vh] flex flex-col items-center justify-center p-4 relative">

    <!-- 🔔 Notifications -->
    {#if timer.error}
        <div transition:slide class="absolute top-4 z-50 rounded-xl bg-red-50/90 backdrop-blur border border-red-200 p-4 text-red-700 shadow-lg">
            {timer.error}
        </div>
    {/if}
    {#if timer.successMessage}
        <div transition:slide class="absolute top-4 z-50 rounded-xl bg-green-50/90 backdrop-blur border border-green-200 p-4 text-green-700 shadow-lg flex items-center gap-2">
            <span>🏆</span> {timer.successMessage}
        </div>
    {/if}

    <!-- Layout Container -->
    <div class="flex flex-col md:flex-row gap-6 items-center justify-center w-full max-w-5xl">

        <!-- ⚙️ Left Column: Configuration -->
        <div class="w-full md:w-1/2 max-w-md order-2 md:order-1">
            <div class="rounded-[2rem] bg-white/40 backdrop-blur-md border border-white/40 p-8 shadow-sm h-full flex flex-col justify-center">
                <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>⚡</span> Session Setup
                </h3>

                <div class="space-y-6">
                    <!-- Inputs -->
                    <div class="space-y-4">
                        <div class="space-y-1">
                            <label class="text-xs font-semibold text-gray-500 uppercase ml-1">Goal</label>
                            <input bind:value={timer.session.title} placeholder="What are you working on?" 
                                disabled={timer.isRunning}
                                class="w-full bg-white/60 border-0 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-200 transition disabled:opacity-50 shadow-sm"/>
                        </div>
                        
                        <div class="space-y-1">
                            <label class="text-xs font-semibold text-gray-500 uppercase ml-1">Context</label>
                            <select bind:value={timer.session.selectedCourseId} disabled={timer.isRunning}
                                class="w-full bg-white/60 border-0 rounded-xl px-4 py-3 text-sm text-gray-600 focus:ring-2 focus:ring-indigo-200 transition disabled:opacity-50 shadow-sm">
                                <option value="">General Task</option>
                                {#each $courses as course}
                                    <option value={course.id}>{course.title}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <!-- Sliders / Counters -->
                    <div class="grid grid-cols-3 gap-4 pt-2">
                        <!-- Work Duration -->
                        <div class="p-3 bg-white/40 rounded-2xl flex flex-col items-center">
                            <label class="text-[10px] font-bold text-indigo-500 uppercase mb-1">Focus</label>
                            <input type="number" bind:value={timer.config.workDuration} onchange={() => timer.updateDuration()} disabled={timer.isRunning} min="1" max="60"
                                class="w-full bg-transparent border-0 text-center text-xl font-bold text-gray-800 focus:ring-0 px-0 disabled:opacity-50 p-0"/>
                            <span class="text-[10px] text-gray-400">min</span>
                        </div>
                        
                        <!-- Break Duration -->
                        <div class="p-3 bg-white/40 rounded-2xl flex flex-col items-center">
                            <label class="text-[10px] font-bold text-teal-500 uppercase mb-1">Break</label>
                            <input type="number" bind:value={timer.config.breakDuration} onchange={() => timer.updateDuration()} disabled={timer.isRunning} min="1" max="30"
                                class="w-full bg-transparent border-0 text-center text-xl font-bold text-gray-800 focus:ring-0 px-0 disabled:opacity-50 p-0"/>
                            <span class="text-[10px] text-gray-400">min</span>
                        </div>
                        
                        <!-- Cycles -->
                        <div class="p-3 bg-white/40 rounded-2xl flex flex-col items-center">
                            <label class="text-[10px] font-bold text-purple-500 uppercase mb-1">Rounds</label>
                            <input type="number" bind:value={timer.config.cycles} disabled={timer.isRunning} min="1" max="8"
                                class="w-full bg-transparent border-0 text-center text-xl font-bold text-gray-800 focus:ring-0 px-0 disabled:opacity-50 p-0"/>
                            <span class="text-[10px] text-gray-400">cycles</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ⏱️ Right Column: Timer Display -->
        <div class="w-full md:w-1/2 max-w-md order-1 md:order-2">
            <div class="relative overflow-hidden rounded-[3rem] bg-white/60 backdrop-blur-2xl border border-white/60 shadow-2xl p-8 flex flex-col items-center justify-center min-h-[420px]">
                
                <!-- Header Info -->
                <div class="text-center space-y-2 mb-8 absolute top-8">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-colors duration-500
                        {timer.isBreak ? 'bg-teal-100 text-teal-700' : 'bg-indigo-100 text-indigo-700'}">
                        {timer.isBreak ? '☕ Break Time' : '🔥 Focus Mode'}
                    </div>
                    <p class="text-xs font-semibold text-gray-400">Cycle {timer.currentCycle} of {timer.config.cycles}</p>
                </div>

                <!-- The Glowing Ring -->
                <div class="relative w-64 h-64 mt-8 mb-8 group">
                    <!-- SVG Ring -->
                    <svg class="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
                        <!-- Background Track -->
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3" class="text-gray-200/50" />
                        <!-- Animated Progress -->
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3" 
                            stroke-dasharray="283" 
                            stroke-dashoffset={timer.strokeDashoffset}
                            stroke-linecap="round"
                            class="transition-all duration-1000 ease-linear
                            {timer.isBreak ? 'text-teal-400' : 'text-indigo-500'}" 
                        />
                    </svg>
                    
                    <!-- Digital Time Display -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-6xl font-black tracking-tighter tabular-nums bg-gradient-to-br bg-clip-text text-transparent transition-all duration-500
                            {timer.isBreak ? 'from-teal-500 to-green-600' : 'from-indigo-600 to-purple-600'}
                            {timer.isRunning ? 'animate-pulse-slow' : ''}">
                            {timer.formatTime(timer.timeLeft)}
                        </span>
                        <p class="text-sm font-medium text-gray-400 mt-2 truncate max-w-[150px]">
                            {timer.session.title || 'Ready to start'}
                        </p>
                    </div>
                </div>

                <!-- Controls -->
                <div class="flex items-center gap-6 w-full justify-center absolute bottom-8">
                    <!-- Reset Button -->
                    <button onclick={() => timer.reset()} 
                        class="p-4 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" 
                        title="Reset">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>

                    <!-- Toggle Start/Pause Button -->
                    <button onclick={() => timer.toggle()} 
                        class="h-16 w-16 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95
                        {timer.isRunning ? 'bg-white text-gray-800 border-2 border-gray-100' : 'bg-gray-900 text-white hover:shadow-indigo-500/25'}">
                        {#if timer.isRunning}
                            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                        {:else}
                            <svg class="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        {/if}
                    </button>
                </div>
            </div>
        </div>

    </div>
</div>

<style>
    @keyframes pulse-slow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
    }
    .animate-pulse-slow {
        animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
</style>