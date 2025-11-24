<!-- src/lib/components/study-logs/ManualStudyLogForm.svelte -->
<script>
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/stores/auth';
    import { courses } from '$lib/stores/data';

    export let onSubmit = () => {};

    let title = '';
    let selectedCourseId = '';
    let notes = '';
    let duration = '';
    let manualDate = new Date().toISOString().split('T')[0];
    let tags = [];
    let tagsInput = '';
    let error = null;

    function handleTagInput(e) {
        const input = e.target.value;
        if (input.endsWith(',')) {
            const newTag = input.slice(0, -1).trim().toLowerCase();
            if (newTag && !tags.includes(newTag)) {
                tags = [...tags, newTag];
            }
            tagsInput = '';
        }
    }

    function removeTag(tagToRemove) {
        tags = tags.filter(tag => tag !== tagToRemove);
    }

    async function submitManualEntry() {
        if (!title || !duration) {
            error = "Please enter both title and duration";
            return;
        }

        try {
            const { data, error: err } = await supabase
                .from('study_logs')
                .insert({
                    user_id: $user.id,
                    title,
                    course_id: selectedCourseId || null,
                    notes,
                    duration: parseInt(duration),
                    date: new Date().toISOString(),
                    tags,
                })
                .select()
                .single();

            if (err) throw err;

            // Reset form
            title = '';
            selectedCourseId = '';
            notes = '';
            duration = '';
            tags = [];
            tagsInput = '';
            error = null;

            onSubmit(); // notify parent to reload logs
        } catch (err) {
            error = err.message;
        }
    }
</script>

<div class="bg-white rounded-lg shadow-sm p-6 space-y-4">
    <h2 class="text-xl font-semibold text-gray-900">Log Study Session</h2>
    {#if error}
        <div class="text-red-600 text-sm">{error}</div>
    {/if}
    <div class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-gray-700">Title</label>
            <input bind:value={title} type="text" class="mt-1 block w-full border px-3 py-2 rounded-md" />
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input bind:value={duration} type="number" class="mt-1 block w-full border px-3 py-2 rounded-md" />
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700">Date</label>
            <input bind:value={manualDate} type="date" class="mt-1 block w-full border px-3 py-2 rounded-md" />
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700">Course (Optional)</label>
            <select bind:value={selectedCourseId} class="mt-1 block w-full border px-3 py-2 rounded-md">
                <option value="">No course</option>
                {#each $courses as course}
                    <option value={course.id}>{course.title}</option>
                {/each}
            </select>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700">Tags</label>
            <input
                bind:value={tagsInput}
                on:input={handleTagInput}
                placeholder="Add tags, comma-separated"
                class="mt-1 block w-full border px-3 py-2 rounded-md"
            />
            <div class="flex flex-wrap gap-2 mt-2">
                {#each tags as tag}
                    <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm flex items-center">
                        {tag}
                        <button type="button" on:click={() => removeTag(tag)} class="ml-1 text-indigo-600 hover:text-indigo-800">×</button>
                    </span>
                {/each}
            </div>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700">Notes</label>
            <textarea bind:value={notes} rows="3" class="mt-1 block w-full border px-3 py-2 rounded-md"></textarea>
        </div>

        <button on:click={submitManualEntry} class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500">
            Log Study Session
        </button>
    </div>
</div>
