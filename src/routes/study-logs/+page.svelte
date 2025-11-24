<script>
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/stores/auth';
    import ManualStudyLogForm from '$lib/components/study-logs/ManualStudyLogForm.svelte';
    import StudyLogCard from '$lib/components/study-logs/studyLogCard.svelte';
    import { slide, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- State (Runes) ---
    let loading = $state(false);
    let error = $state(null);
    let logs = $state([]);
    let showForm = $state(false);

    // --- Logic ---
    
    async function loadLogs() {
        if (!$user) return;
        
        try {
            loading = true;
            const { data, error: err } = await supabase
                .from('study_logs')
                .select(`
                    *,
                    course:courses (
                        title
                    )
                `)
                .eq('user_id', $user.id)
                .order('date', { ascending: false })
                .limit(15);

            if (err) throw err;
            logs = data;
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this log?")) return;
        
        try {
            const { error: err } = await supabase
                .from('study_logs')
                .delete()
                .eq('id', id);

            if (err) throw err;
            await loadLogs(); 
        } catch (err) {
            error = err.message;
        }
    }

    // Reactive Effect (replaces $:)
    $effect(() => {
        if ($user) {
            loadLogs();
        }
    });

    // Callback for the form component
    function handleFormSubmit() {
        loadLogs();
        showForm = false; // Auto-close on success
    }
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-20 left-10 w-96 h-96 bg-teal-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
</div>

<div class="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 pb-20">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
        <div>
            <h1 class="text-4xl font-extrabold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
                Study Logs
            </h1>
            <p class="mt-2 text-gray-600 text-lg">
                Track your progress and manage your sessions.
            </p>
        </div>

        <button
            onclick={() => showForm = !showForm}
            class="group relative inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white transition-all duration-200 bg-gray-900 rounded-full hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
        >
            {#if showForm}
                <span>Close Log</span>
            {:else}
                <span>+ Log Session</span>
            {/if}
        </button>
    </div>

    {#if error}
        <div transition:slide class="rounded-xl bg-red-50/90 backdrop-blur border border-red-200 p-4 text-red-700">
            {error}
        </div>
    {/if}

    {#if showForm}
        <div transition:slide={{duration:400, easing:quintOut}} class="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl p-6 md:p-8 animate-fade-up">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
            
            <div class="relative z-10">
                <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>⏱️</span> Manual Entry
                </h2>
                <ManualStudyLogForm onSubmit={handleFormSubmit} />
            </div>
        </div>
    {/if}

    <div class="space-y-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>📅</span> Recent Activity
        </h2>
        
        {#if loading}
            <div class="space-y-4">
                {#each Array(3) as _}
                    <div class="h-32 rounded-2xl bg-white/40 animate-pulse border border-white/30"></div>
                {/each}
            </div>

        {:else if logs.length === 0}
            <div in:fade class="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-gray-300 bg-white/30 text-center">
                <span class="text-4xl mb-4">📉</span>
                <h3 class="text-lg font-medium text-gray-900">No logs recorded</h3>
                <p class="mt-2 text-gray-500 text-sm">Start the timer or manually log a session to see data here.</p>
            </div>

        {:else}
            <div class="grid gap-4">
                {#each logs as log, i (log.id)}
                    <div class="animate-fade-up" style="animation-delay: {i * 100}ms">
                        <StudyLogCard
                            id={log.id}
                            title={log.title}
                            course={log.course?.title}
                            date={log.date}
                            duration={log.duration}
                            notes={log.notes}
                            tags={log.tags}
                            onDelete={handleDelete}
                        />
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>