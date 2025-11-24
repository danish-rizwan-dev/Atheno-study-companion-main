<script>
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/stores/auth';
    import ManualStudyLogForm from '$lib/components/study-logs/ManualStudyLogForm.svelte';
    import StudyLogCard from '$lib/components/study-logs/studyLogCard.svelte';

    let loading = false;
    let error = null;
    let logs = [];

    async function loadLogs() {
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
        try {
            const { error: err } = await supabase
                .from('study_logs')
                .delete()
                .eq('id', id);

            if (err) throw err;
            await loadLogs(); // Reload the list after deletion
        } catch (err) {
            error = err.message;
        }
    }

    $: {
        if ($user) {
            loadLogs();
        }
    }
</script>

<div class="p-6 max-w-7xl mx-auto space-y-8">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">Study Logs</h1>
        <p class="mt-1 text-sm text-gray-500">Track and manage your study sessions</p>
    </div>

    {#if error}
        <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
        </div>
    {/if}

    <ManualStudyLogForm onSubmit={loadLogs} />

    <div class="mt-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Study Sessions</h2>
        
        {#if loading}
            <div class="flex items-center justify-center py-12">
                <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            </div>
        {:else if logs.length === 0}
            <div class="rounded-lg bg-gray-50 p-8 text-center">
                <h3 class="text-lg font-medium text-gray-900">No study logs yet</h3>
                <p class="mt-2 text-sm text-gray-500">
                    Start tracking your study sessions to see them here.
                </p>
            </div>
        {:else}
            <div class="space-y-4">
                {#each logs as log (log.id)}
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
                {/each}
            </div>
        {/if}
    </div>
</div>
