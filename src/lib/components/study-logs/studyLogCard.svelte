<script>
    // --- Props (Svelte 5) ---
    let { 
        id, 
        title, 
        course, 
        date, 
        duration, 
        notes, 
        tags = [], 
        onDelete 
    } = $props();

    // --- Logic ---
    function formatDateTime(dateString) {
        return new Date(dateString).toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    function formatDuration(minutes) {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
        if (hrs > 0) return `${hrs} hr`;
        return `${mins} min`;
    }

    function handleDelete() {
        // No confirm alert here -> UI usually handles confirmation or undo, 
        // but if you strictly want the browser alert:
        // if (confirm('Delete log?')) onDelete(id);
        onDelete(id); 
    }
</script>

<div class="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white/90">
    
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%] transition duration-[1.2s] pointer-events-none z-10"></div>

    <div class="relative z-20 p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        
        <div class="flex-1 min-w-0 space-y-2">
            
            <div class="flex flex-wrap items-center gap-2">
                {#if course}
                    <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                        📚 {course}
                    </span>
                {/if}
                
                <span class="text-xs font-medium text-gray-400 flex items-center gap-1">
                    📅 {formatDateTime(date)}
                </span>
            </div>

            <h3 class="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                {title}
            </h3>

            {#if notes}
                <p class="text-sm text-gray-500 line-clamp-2 leading-relaxed max-w-xl">
                    {notes}
                </p>
            {/if}

            {#if tags?.length > 0}
                <div class="flex flex-wrap gap-2 pt-1">
                    {#each tags as tag}
                        <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            #{tag}
                        </span>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="flex items-center gap-5 self-end sm:self-center pl-2 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-6 pt-4 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
            
            <div class="text-right">
                <div class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600">
                    {formatDuration(duration)}
                </div>
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Focused</div>
            </div>

            <button 
                onclick={handleDelete}
                aria-label="Delete log"
                class="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm transition-all sm:opacity-0 sm:translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0"
                title="Delete Log"
            >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>

    </div>
</div>