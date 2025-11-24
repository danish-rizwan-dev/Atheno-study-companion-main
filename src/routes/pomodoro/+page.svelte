<script>
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { user } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabase';
    import { page as PageData } from '$app/state';
    import { courses } from '$lib/stores/data';

    let title = $state('');
    let workDuration = $state(25);
    let breakDuration = $state(5);
    let cycles = $state(4);
    let selectedCourseId = $state('');
    let isRunning = $state(false);
    let currentCycle = $state(1);
    let isBreak = $state(false);
    let timeLeft = $derived(workDuration * 60);
    let interruptions = $state(0);

    let startTime = $state(null);
    let endTime = $state(null);
    // let timeLeft = workDuration * 60;
    let timer;

    let error = $state(null);
    let successMessage = $state(null);

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (!title) {
            error = "Please enter a title for your session";
            return;
        }
        
        isRunning = true;
        error = null;
        startTime = new Date().toISOString();
        
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
            } else {
                // Cycle completed
                if (isBreak) {
                    // Break finished
                    if (currentCycle < cycles) {
                        currentCycle++;
                        isBreak = false;
                        timeLeft = workDuration * 60;
                        playSound('work');
                    } else {
                        // All cycles completed
                        completeSession();
                    }
                } else {
                    // Work period finished
                    isBreak = true;
                    timeLeft = breakDuration * 60;
                    playSound('break');
                }
            }
        }, 1000);
    }

    function pauseTimer() {
        isRunning = false;
        interruptions++;
        clearInterval(timer);
    }

    function resetTimer() {
        isRunning = false;
        clearInterval(timer);
        currentCycle = 1;
        isBreak = false;
        timeLeft = workDuration * 60;
    }

    function playSound(type) {
        const audio = new Audio(type === 'work' ? '/work.mp3' : '/break.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
    }

    async function completeSession() {
        isRunning = false;
        clearInterval(timer);

        try {
            const { error: err } = await supabase
                .from('pomodoro_sessions')
                .insert({
                    user_id: $user.id,
                    notes : title,
                    course_id: selectedCourseId ||   null,
                    work_duration: workDuration,
                    break_duration: breakDuration,
                    started_at : startTime,
                    completed : true,
                    ended_at : new Date().toISOString(),
                    interruptions: interruptions,
                    // total_duration: (workDuration * cycles + breakDuration * (cycles - 1))
                });

            if (err) throw err;

            successMessage = "Session completed and saved!";
            setTimeout(() => {
                interruptions = 0;
                successMessage = null;
            }, 3000);

            // Reset form
            title = '';
            selectedCourseId = '';
            resetTimer();
        } catch (err) {
            error = err.message;
        }
    }

    // Cleanup on component unmount
    onDestroy(() => {
        if (timer) clearInterval(timer);
    });
</script>

<div class="max-w-3xl mx-auto space-y-8">
    <div>
        <h1 class="text-2xl font-bold text-gray-900">Pomodoro Timer</h1>
        <p class="mt-1 text-sm text-gray-500">Stay focused with customizable work and break intervals.</p>
    </div>

    {#if error}
        <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
        </div>
    {/if}

    {#if successMessage}
        <div class="rounded-md bg-green-50 p-4">
            <p class="text-sm text-green-700">{successMessage}</p>
        </div>
    {/if}

    <!-- Timer Display -->
    <div class="rounded-lg bg-white p-8 text-center shadow-sm">
        <div class="my-2 font-bold text-lg text-gray-900">
            {title || 'Pomodoro Timer'}
        </div>
        <div class="mb-2 text-xs font-medium text-gray-900">
            {isRunning ? 'Timer is Running' : 'Timer is Paused'} 
        </div>
        <div class="mb-6 text-6xl font-bold text-indigo-600">{formatTime(timeLeft)}</div>
        <div class="mb-4">
            <span class="text-lg font-medium text-gray-900">
                {isBreak ? 'Break Time' : 'Work Time'} - Cycle {currentCycle}/{cycles}
            </span>
        </div>
        <div class="flex justify-center gap-4">
            <button
                onclick={isRunning ? pauseTimer : startTimer}
                class="rounded-lg hover:cursor-pointer bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-500"
            >
                {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
                onclick={resetTimer}
                class="rounded-lg border hover:cursor-pointer border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
            >
                Reset
            </button>
        </div>
    </div>

    <!-- Settings -->
    <div class="rounded-lg bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900">Session Settings</h2>
        <div class="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
                <label for="title" class="block text-sm font-medium text-gray-700">Session Title</label>
                <input
                    bind:value={title}
                    type="text"
                    id="title"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="e.g., Study Mathematics"
                />
            </div>

            <div>
                <label for="course" class="block text-sm font-medium text-gray-700">Related Course (optional)</label>
                <select
                    bind:value={selectedCourseId}
                    id="course"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                    <option value="">No course selected</option>
                    {#each $courses as course}
                        <option value={course.id}>{course.title}</option>
                    {/each}
                </select>
            </div>

            <div>
                <label for="workDuration" class="block text-sm font-medium text-gray-700">Work Duration (minutes)</label>
                <input
                    bind:value={workDuration}
                    type="number"
                    id="workDuration"
                    min="1"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
            </div>

            <div>
                <label for="breakDuration" class="block text-sm font-medium text-gray-700">Break Duration (minutes)</label>
                <input
                    bind:value={breakDuration}
                    type="number"
                    id="breakDuration"
                    min="1"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
            </div>

            <div>
                <label for="cycles" class="block text-sm font-medium text-gray-700">Number of Cycles</label>
                <input
                    bind:value={cycles}
                    type="number"
                    id="cycles"
                    min="1"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
            </div>
        </div>
    </div>

    <!-- Instructions -->
    <div class="rounded-lg bg-indigo-50 p-6">
        <h3 class="font-medium text-indigo-900">How it works:</h3>
        <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-indigo-800">
            <li>Set your preferred work duration, break duration, and number of cycles</li>
            <li>Click start to begin your focused work session</li>
            <li>Work until the timer runs out, then take a break</li>
            <li>Repeat until all cycles are complete</li>
            <li>Your session will be saved automatically when completed</li>
        </ul>
    </div>
</div>