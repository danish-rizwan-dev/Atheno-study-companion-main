<script>
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/stores/auth';
    import { courses, tasks } from '$lib/stores/data';
    import { onMount } from 'svelte';

    let loading = false;
    let error = null;
    let showForm = false;

    // Form data
    let title = '';
    let description = '';
    let dueDate = '';
    let priority = 'medium';
    let selectedCourseId = '';
    let status = 'pending';

    // Filters
    let filterStatus = 'all';
    let filterPriority = 'all';
    let filterCourse = 'all';
    let searchQuery = '';

    const priorities = ['low', 'medium', 'high'];
    const statuses = ['pending', 'in-progress', 'completed'];

    async function createTask() {
        if (!title) {
            error = "Please enter a task title";
            return;
        }

        try {
            loading = true;
            error = null;

            const { data, error: err } = await supabase
                .from('tasks')
                .insert({
                    user_id: $user.id,
                    title,
                    description,
                    due_date: dueDate || null,
                    priority,
                    course_id: selectedCourseId || null,
                    status
                })
                .select()
                .single();

            if (err) throw err;

            // Update local state
            tasks.update(current => [data, ...current]);

            // Reset form
            title = '';
            description = '';
            dueDate = '';
            priority = 'medium';
            selectedCourseId = '';
            status = 'pending';
            showForm = false;
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function updateTaskStatus(taskId, newStatus) {
        try {
            const { error: err } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (err) throw err;

            // Update local state
            tasks.update(current =>
                current.map(task =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                )
            );
        } catch (err) {
            error = err.message;
        }
    }

    async function deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        try {
            const { error: err } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (err) throw err;

            // Update local state
            tasks.update(current => current.filter(task => task.id !== id));
        } catch (err) {
            error = err.message;
        }
    }

    // Computed properties for filtered tasks
    $: filteredTasks = $tasks.filter(task => {
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        const matchesCourse = filterCourse === 'all' || task.course_id === filterCourse;
        const matchesSearch = searchQuery === '' || 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesPriority && matchesCourse && matchesSearch;
    }).sort((a, b) => {
        // Sort by due date (if exists), then by priority
        if (a.due_date && b.due_date) {
            return new Date(a.due_date) - new Date(b.due_date);
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Priority color classes
    const priorityColors = {
        high: 'text-red-600 bg-red-50',
        medium: 'text-yellow-600 bg-yellow-50',
        low: 'text-green-600 bg-green-50'
    };

    // Status color classes
    const statusColors = {
        'pending': 'text-yellow-600 bg-yellow-50',
        'in-progress': 'text-blue-600 bg-blue-50',
        'completed': 'text-green-600 bg-green-50'
    };

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
</script>

<div class="space-y-8">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Tasks</h1>
            <p class="mt-1 text-sm text-gray-500">Manage your tasks and assignments</p>
        </div>
        <button
            on:click={() => showForm = !showForm}
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
            {showForm ? 'Cancel' : 'Add Task'}
        </button>
    </div>

    {#if error}
        <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
        </div>
    {/if}

    <!-- Task Creation Form -->
    {#if showForm}
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900">Add New Task</h2>
            <div class="mt-4 grid gap-6">
                <div>
                    <label for="taskTitle" class="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        id="taskTitle"
                        bind:value={title}
                        type="text"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="What needs to be done?"
                    />
                </div>

                <div>
                    <label for="taskDescription" class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        id="taskDescription"
                        bind:value={description}
                        rows="3"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Add more details..."
                    ></textarea>
                </div>

                <div class="grid gap-6 sm:grid-cols-2">
                    <div>
                        <label for="taskDueDate" class="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            id="taskDueDate"
                            bind:value={dueDate}
                            type="date"
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                    </div>

                    <div>
                        <label for="taskPriority" class="block text-sm font-medium text-gray-700">Priority</label>
                        <select
                            id="taskPriority"
                            bind:value={priority}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            {#each priorities as p}
                                <option value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label for="taskCourse" class="block text-sm font-medium text-gray-700">Course (Optional)</label>
                        <select
                            id="taskCourse"
                            bind:value={selectedCourseId}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="">No course</option>
                            {#each $courses as course}
                                <option value={course.id}>{course.title}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label for="taskStatus" class="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="taskStatus"
                            bind:value={status}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            {#each statuses as s}
                                <option value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button
                        on:click={createTask}
                        disabled={loading || !title}
                        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Filters -->
    <div class="rounded-lg bg-white p-6 shadow-sm">
        <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
                <label for="searchQuery" class="block text-sm font-medium text-gray-700">Search</label>
                <input
                    id="searchQuery"
                    bind:value={searchQuery}
                    type="text"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Search tasks..."
                />
            </div>

            <div>
                <label for="filterStatus" class="block text-sm font-medium text-gray-700">Status</label>
                <select
                    id="filterStatus"
                    bind:value={filterStatus}
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                    <option value="all">All</option>
                    {#each statuses as s}
                        <option value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                    {/each}
                </select>
            </div>

            <div>
                <label for="filterPriority" class="block text-sm font-medium text-gray-700">Priority</label>
                <select
                    id="filterPriority"
                    bind:value={filterPriority}
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                    <option value="all">All</option>
                    {#each priorities as p}
                        <option value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    {/each}
                </select>
            </div>

            <div>
                <label for="filterCourse" class="block text-sm font-medium text-gray-700">Course</label>
                <select
                    id="filterCourse"
                    bind:value={filterCourse}
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                    <option value="all">All</option>
                    {#each $courses as course}
                        <option value={course.id}>{course.title}</option>
                    {/each}
                </select>
            </div>
        </div>
    </div>

    <!-- Tasks List -->
    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
    {:else if filteredTasks.length === 0}
        <div class="rounded-lg bg-gray-50 p-8 text-center">
            <h3 class="text-lg font-medium text-gray-900">No tasks found</h3>
            <p class="mt-2 text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterCourse !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Create your first task to get started'}
            </p>
        </div>
    {:else}
        <div class="space-y-4">
            {#each filteredTasks as task (task.id)}
                <div class="group relative overflow-hidden rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div class="absolute right-2 top-2">
                        <button
                            on:click={() => deleteTask(task.id)}
                            class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                            ×
                        </button>
                    </div>

                    <div class="grid gap-4 md:grid-cols-[1fr,auto]">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">{task.title}</h3>
                            {#if task.description}
                                <p class="mt-1 text-sm text-gray-600">{task.description}</p>
                            {/if}
                            
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="rounded-full px-2 py-1 text-xs font-medium {priorityColors[task.priority]}">
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                                </span>
                                {#if task.course_id}
                                    <span class="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                                        {$courses.find(c => c.id === task.course_id)?.title}
                                    </span>
                                {/if}
                                {#if task.due_date}
                                    <span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                        Due {formatDate(task.due_date)} | {(() => {
                                            const today = new Date();
                                            const dueDate = new Date(task.due_date);
                                            const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
                                            if (diffDays === 0) return 'Today';
                                            if (diffDays > 0) return `${diffDays} days to go`;
                                            return `${Math.abs(diffDays)} days overdue`;
                                        })()}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <select
                                value={task.status}
                                on:change={e => updateTaskStatus(task.id, e.target.value)}
                                class={`rounded-lg border px-3 py-1 text-sm font-medium ${statusColors[task.status]}`}
                            >
                                {#each statuses as s}
                                    <option value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                                    </option>
                                {/each}
                            </select>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>