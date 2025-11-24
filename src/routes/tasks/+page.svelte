<script>
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/stores/auth';
    import { courses, tasks } from '$lib/stores/data';
    import { slide, fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- State (Svelte 5 Runes) ---
    let loading = $state(false);
    let error = $state(null);
    let showForm = $state(false);

    // Form data
    let title = $state('');
    let description = $state('');
    let dueDate = $state('');
    let priority = $state('medium');
    let selectedCourseId = $state('');
    let status = $state('pending');

    // Filters
    let filterStatus = $state('all');
    let filterPriority = $state('all');
    let filterCourse = $state('all');
    let searchQuery = $state('');

    const priorities = ['low', 'medium', 'high'];
    const statuses = ['pending', 'in-progress', 'completed'];

    // --- Logic ---

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

            tasks.update(current => [data, ...current]);
            
            // Reset
            title = ''; description = ''; dueDate = ''; priority = 'medium';
            selectedCourseId = ''; status = 'pending'; showForm = false;
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
        if (!confirm('Permanently delete this task?')) return;
        try {
            const { error: err } = await supabase.from('tasks').delete().eq('id', id);
            if (err) throw err;
            tasks.update(current => current.filter(task => task.id !== id));
        } catch (err) {
            error = err.message;
        }
    }

    // Computed Filter Logic
    let filteredTasks = $derived(
        $tasks.filter(task => {
            const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
            const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
            const matchesCourse = filterCourse === 'all' || task.course_id === filterCourse;
            const matchesSearch = searchQuery === '' || 
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesStatus && matchesPriority && matchesCourse && matchesSearch;
        }).sort((a, b) => {
            // Sort by status (completed last), then due date
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            
            if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
            if (a.due_date) return -1;
            if (b.due_date) return 1;
            
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
    );

    // --- Formatters & Helpers ---
    
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function getDueStatus(dateString, taskStatus) {
        if (!dateString || taskStatus === 'completed') return { text: '', color: 'text-gray-400 bg-gray-50' };
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(dateString);
        due.setHours(0,0,0,0);
        
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: `${Math.abs(diffDays)}d Overdue`, color: 'text-red-700 bg-red-100 border-red-200' };
        if (diffDays === 0) return { text: 'Due Today', color: 'text-orange-700 bg-orange-100 border-orange-200' };
        if (diffDays === 1) return { text: 'Tomorrow', color: 'text-indigo-700 bg-indigo-100 border-indigo-200' };
        return { text: formatDate(dateString), color: 'text-gray-600 bg-gray-100 border-gray-200' };
    }

    const priorityConfig = {
        high: { color: 'text-rose-700 bg-rose-50 border-rose-100', icon: '🔴' },
        medium: { color: 'text-amber-700 bg-amber-50 border-amber-100', icon: '🟡' },
        low: { color: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: '🟢' }
    };

    const statusConfig = {
        'pending': 'bg-gray-100 text-gray-600 border-gray-200',
        'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
        'completed': 'bg-green-50 text-green-700 border-green-200 line-through opacity-70'
    };
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-20 left-10 w-96 h-96 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
</div>

<div class="space-y-8 px-2 sm:px-0 pb-20 max-w-5xl mx-auto">

    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
        <div>
            <h1 class="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                Task Board
            </h1>
            <p class="mt-2 text-gray-600 text-lg">
                Organize your assignments and deadlines.
            </p>
        </div>
        <button
            onclick={() => showForm = !showForm}
            class="group relative inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white transition-all duration-200 bg-gray-900 rounded-full hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
        >
            {#if showForm}
                <span>Cancel</span>
            {:else}
                <span>+ New Task</span>
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
            <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span>⚡</span> Create New Task
            </h2>
            
            <div class="grid gap-6">
                <div class="space-y-4">
                    <input bind:value={title} placeholder="What needs to be done?" 
                        class="w-full text-lg font-medium placeholder:text-gray-400 border-0 border-b-2 border-gray-200 bg-transparent px-0 py-2 focus:ring-0 focus:border-indigo-600 transition-colors"/>
                    
                    <textarea bind:value={description} rows="2" placeholder="Add details..." 
                        class="w-full text-sm text-gray-600 placeholder:text-gray-400 border-0 bg-transparent px-0 py-2 focus:ring-0 resize-none"></textarea>
                </div>

                <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-gray-500 uppercase">Due Date</label>
                        <input type="date" bind:value={dueDate} class="w-full rounded-lg border-gray-200 bg-white/50 text-sm focus:ring-indigo-500"/>
                    </div>
                    
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-gray-500 uppercase">Priority</label>
                        <select bind:value={priority} class="w-full rounded-lg border-gray-200 bg-white/50 text-sm focus:ring-indigo-500">
                            {#each priorities as p}
                                <option value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-gray-500 uppercase">Course</label>
                        <select bind:value={selectedCourseId} class="w-full rounded-lg border-gray-200 bg-white/50 text-sm focus:ring-indigo-500">
                            <option value="">General Task</option>
                            {#each $courses as course}
                                <option value={course.id}>{course.title}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="flex items-end">
                        <button onclick={createTask} disabled={loading || !title}
                            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 transition">
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <div class="sticky top-4 z-30 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm border border-white/50 p-4 animate-fade-up">
        <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1 relative">
                <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
                <input bind:value={searchQuery} type="text" placeholder="Search tasks..." 
                    class="w-full pl-10 rounded-xl border-gray-200 bg-white/50 focus:border-indigo-500 focus:ring-indigo-500 transition"/>
            </div>
            
            <div class="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                <select bind:value={filterStatus} class="rounded-xl border-gray-200 bg-white/50 text-sm focus:ring-indigo-500 min-w-[120px]">
                    <option value="all">Status: All</option>
                    {#each statuses as s}
                        <option value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    {/each}
                </select>

                <select bind:value={filterPriority} class="rounded-xl border-gray-200 bg-white/50 text-sm focus:ring-indigo-500 min-w-[120px]">
                    <option value="all">Priority: All</option>
                    {#each priorities as p}
                        <option value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    {/each}
                </select>

                <select bind:value={filterCourse} class="rounded-xl border-gray-200 bg-white/50 text-sm focus:ring-indigo-500 min-w-[120px]">
                    <option value="all">Course: All</option>
                    {#each $courses as course}
                        <option value={course.id}>{course.title}</option>
                    {/each}
                </select>
            </div>
        </div>
    </div>

    {#if loading && !filteredTasks.length}
        <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
        </div>
    {:else if filteredTasks.length === 0}
        <div in:fade class="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-gray-300 bg-white/30 text-center">
            <span class="text-4xl mb-4">✨</span>
            <h3 class="text-lg font-medium text-gray-900">All caught up!</h3>
            <p class="mt-2 text-gray-500 text-sm">No tasks match your filters.</p>
        </div>
    {:else}
        <div class="space-y-4">
            {#each filteredTasks as task, i (task.id)}
                <div class="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-up"
                     style="animation-delay: {i * 50}ms">
                    
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%] transition duration-[1.2s] pointer-events-none z-10"></div>

                    <div class="p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        
                        <div class="flex items-start gap-4 flex-1">
                            <button 
                                onclick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                                class="mt-1 flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all
                                {task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-400 bg-white'}">
                                {#if task.status === 'completed'}
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                {/if}
                            </button>

                            <div class="space-y-1 w-full">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h3 class="text-lg font-bold text-gray-900 {task.status === 'completed' ? 'line-through text-gray-400' : ''}">
                                        {task.title}
                                    </h3>
                                    
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border {priorityConfig[task.priority].color}">
                                        {priorityConfig[task.priority].icon} {task.priority.toUpperCase()}
                                    </span>
                                </div>
                                
                                {#if task.description}
                                    <p class="text-sm text-gray-500 line-clamp-1 {task.status === 'completed' ? 'line-through opacity-50' : ''}">
                                        {task.description}
                                    </p>
                                {/if}

                                <div class="flex flex-wrap gap-2 pt-1">
                                    {#if task.course_id}
                                        <span class="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                            📚 {$courses.find(c => c.id === task.course_id)?.title}
                                        </span>
                                    {/if}

                                    {#if task.due_date}
                                        {@const status = getDueStatus(task.due_date, task.status)}
                                        <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border {status.color}">
                                            📅 {status.text}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-3 pl-10 md:pl-0">
                            <div class="relative">
                                <select 
                                    value={task.status} 
                                    onchange={(e) => updateTaskStatus(task.id, e.target.value)}
                                    class="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer focus:ring-2 focus:ring-indigo-200 transition-all {statusConfig[task.status]}"
                                >
                                    {#each statuses as s}
                                        <option value={s}>{s.replace('-', ' ')}</option>
                                    {/each}
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>

                            <button onclick={() => deleteTask(task.id)} 
                                class="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete Task">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>