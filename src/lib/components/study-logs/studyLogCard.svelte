<script>
    export let id;
    export let title;
    export let course;
    export let date;
    export let duration;
    export let notes;
    export let tags = [];
    export let onDelete;

    function formatDateTime(dateString) {
        return new Date(dateString).toLocaleString();
    }

    function formatDuration(minutes) {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    }

    function handleDelete() {
        if (confirm('Are you sure you want to delete this study log?')) {
            onDelete(id);
        }
    }
</script>

<div class="group relative overflow-hidden rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md border border-gray-100">
    <div class="grid gap-4 md:grid-cols-[1fr,auto]">
        <div>
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">{title}</h3>
                <button
                    on:click={handleDelete}
                    class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                    ×
                </button>
            </div>

            {#if course}
                <p class="mt-1 text-sm text-indigo-600">{course}</p>
            {/if}

            {#if notes}
                <p class="mt-2 text-sm text-gray-600">{notes}</p>
            {/if}

            {#if tags?.length > 0}
                <div class="mt-2 flex flex-wrap gap-2">
                    {#each tags as tag}
                        <span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs">
                            {tag}
                        </span>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="text-right">
            <div class="text-2xl font-semibold text-gray-900">
                {formatDuration(duration)}
            </div>
            <p class="mt-1 text-sm text-gray-500">
                {formatDateTime(date)}
            </p>
        </div>
    </div>
</div>
