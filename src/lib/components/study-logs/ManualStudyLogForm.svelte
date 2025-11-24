<script>
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/stores/auth';
    import { courses } from '$lib/stores/data';
    import { slide, scale, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- Props (Svelte 5) ---
    let { onSubmit = () => {} } = $props();

    // --- State (Runes) ---
    let title = $state('');
    let selectedCourseId = $state('');
    let notes = $state('');
    let duration = $state('');
    let manualDate = $state(new Date().toISOString().split('T')[0]);
    let tags = $state([]);
    let tagsInput = $state('');
    let error = $state(null);
    let isSubmitting = $state(false);

    // --- Logic ---

    function handleTagInput(e) {
        if (e.key === 'Enter' || e.data === ',') {
            e.preventDefault();
            addTag();
        }
    }

    function addTag() {
        const raw = tagsInput.replace(/,/g, '').trim();
        if (raw && !tags.includes(raw.toLowerCase())) {
            tags = [...tags, raw.toLowerCase()];
        }
        tagsInput = '';
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
            isSubmitting = true;
            error = null;

            const { data, error: err } = await supabase
                .from('study_logs')
                .insert({
                    user_id: $user.id,
                    title,
                    course_id: selectedCourseId || null,
                    notes,
                    duration: parseInt(duration),
                    date: new Date(manualDate).toISOString(),
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
            
            onSubmit(); // Close parent drawer
        } catch (err) {
            error = err.message;
        } finally {
            isSubmitting = false;
        }
    }
</script>

<form onsubmit={(e) => { e.preventDefault(); submitManualEntry(); }} class="space-y-6">
    
    {#if error}
        <div transition:slide class="rounded-xl bg-red-50 border border-red-200/60 p-3 text-sm text-red-600 font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
        </div>
    {/if}

    <div class="grid gap-5 md:grid-cols-2">
        <div class="space-y-1.5">
            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Session Title</label>
            <input 
                bind:value={title} 
                type="text" 
                placeholder="e.g. Chapter 4 Review" 
                class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
        </div>

        <div class="space-y-1.5">
            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Course</label>
            <select 
                bind:value={selectedCourseId} 
                class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none"
            >
                <option value="">Independent Study</option>
                {#each $courses as course}
                    <option value={course.id}>{course.title}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="grid gap-5 grid-cols-2">
        <div class="space-y-1.5">
            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Duration (min)</label>
            <input 
                bind:value={duration} 
                type="number" 
                min="1"
                placeholder="45" 
                class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
        </div>

        <div class="space-y-1.5">
            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Date</label>
            <input 
                bind:value={manualDate} 
                type="date" 
                class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
        </div>
    </div>

    <div class="space-y-1.5">
        <label class="text-xs font-bold text-gray-500 uppercase ml-1">Tags</label>
        <div class="rounded-xl border border-gray-200 bg-white/50 px-2 py-2 shadow-sm focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all flex flex-wrap gap-2">
            
            {#each tags as tag}
                <span transition:scale={{duration:200}} class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold shadow-sm">
                    {tag}
                    <button type="button" onclick={() => removeTag(tag)} class="hover:text-indigo-900 rounded-full p-0.5 transition-colors">
                        ×
                    </button>
                </span>
            {/each}

            <input
                bind:value={tagsInput}
                onkeydown={handleTagInput}
                oninput={(e) => e.data === ',' && addTag()}
                placeholder={tags.length > 0 ? "" : "Add tags (press Enter)..."}
                class="flex-1 bg-transparent border-none p-1.5 text-sm focus:ring-0 outline-none min-w-[120px]"
            />
        </div>
    </div>

    <div class="space-y-1.5">
        <label class="text-xs font-bold text-gray-500 uppercase ml-1">Reflection / Notes</label>
        <textarea 
            bind:value={notes} 
            rows="3" 
            placeholder="What did you accomplish?"
            class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
        ></textarea>
    </div>

    <button
        type="submit"
        disabled={isSubmitting}
        class="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.01] hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
    >
        <span class="relative z-10 flex items-center justify-center gap-2">
            {#if isSubmitting}
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                <span>Saving...</span>
            {:else}
                <span>Log Session</span>
                <span class="transition-transform group-hover:translate-x-1">→</span>
            {/if}
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
    </button>

</form>